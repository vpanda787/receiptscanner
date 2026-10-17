import json, base64, uuid, boto3
from decimal import Decimal
from datetime import date, timedelta
from boto3.dynamodb.conditions import Key

bedrock = boto3.client("bedrock-runtime")
polly = boto3.client("polly")
sns = boto3.client("sns")
TOPIC_ARN = "ARN_HERE"
table = boto3.resource("dynamodb").Table("Inventory")
MODEL_ID = "us.amazon.nova-pro-v1:0"
META_ID = "_meta"
CATEGORIES = {"produce", "dairy", "meat", "seafood", "bakery", "pantry", "frozen", "other"}
EDITABLE = {"name", "quantity", "unit", "category", "purchaseDate", "expirationDate", "nutrition"}

DEMO_ITEMS = [
    # name, quantity, unit, category, days until it expires
    ("Baby spinach", 1, "bag", "produce", 1),
    ("Chicken breast", 1.5, "lb", "meat", 2),
    ("Cilantro", 1, "bunch", "produce", 2),
    ("Greek yogurt", 1, "tub", "dairy", 3),
    ("Flour tortillas", 1, "pack", "bakery", 5),
    ("Cheddar cheese", 8, "oz", "dairy", 10),
    ("Eggs", 1, "dozen", "dairy", 14),
    ("Yellow onions", 3, "each", "produce", 30),
    ("Garlic", 1, "bulb", "produce", 30),
    ("Jasmine rice", 2, "lb", "pantry", 365),
]

# ---------- helpers ----------

def clean(o):
    # DynamoDB returns Decimals; turn them back into normal numbers
    if isinstance(o, list):
        return [clean(x) for x in o]
    if isinstance(o, dict):
        return {k: clean(v) for k, v in o.items()}
    if isinstance(o, Decimal):
        return int(o) if o == o.to_integral_value() else float(o)
    return o

def to_dynamo(obj):
    return json.loads(json.dumps(obj), parse_float=Decimal)

def response(status, body=None):
    return {
        "statusCode": status,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Methods": "*",
        },
        "body": json.dumps(clean(body)) if body is not None else "",
    }

def ask_nova(prompt, max_tokens=2000):
    out = bedrock.converse(
        modelId=MODEL_ID,
        messages=[{"role": "user", "content": [{"text": prompt}]}],
        inferenceConfig={"maxTokens": max_tokens, "temperature": 0.3},
    )
    return out["output"]["message"]["content"][0]["text"]

def extract_json(text, open_ch, close_ch):
    return json.loads(text[text.find(open_ch): text.rfind(close_ch) + 1])

def get_offset(user_id):
    meta = table.get_item(Key={"userId": user_id, "itemId": META_ID}).get("Item")
    return int(meta["offsetDays"]) if meta else 0

def today_for(user_id):
    return date.today() + timedelta(days=get_offset(user_id))

def list_items(user_id):
    resp = table.query(KeyConditionExpression=Key("userId").eq(user_id))
    items = resp["Items"]
    while "LastEvaluatedKey" in resp:
        resp = table.query(
            KeyConditionExpression=Key("userId").eq(user_id),
            ExclusiveStartKey=resp["LastEvaluatedKey"],
        )
        items += resp["Items"]
    items = [i for i in items if i["itemId"] != META_ID]
    items.sort(key=lambda i: i.get("expirationDate", "9999-12-31"))
    return items

def make_item(user_id, name, quantity, unit, category, shelf_days, nutrition=None):
    today = today_for(user_id)
    item = {
        "userId": user_id,
        "itemId": "itm_" + uuid.uuid4().hex[:10],
        "name": name,
        "rawText": "",
        "quantity": float(quantity),
        "unit": unit,
        "category": category if category in CATEGORIES else "other",
        "purchaseDate": today.isoformat(),
        "expirationDate": (today + timedelta(days=int(shelf_days))).isoformat(),
        "edited": False,
    }
    if isinstance(nutrition, dict):
        item["nutrition"] = nutrition
    return item

# ---------- routes ----------

def add_item(user_id, data):
    name = data.get("name", "Unknown item")
    prompt = (
        f'For the grocery item "{name}", return ONLY a JSON object with keys '
        '"shelfLifeDays" (integer, typical days until it goes bad if stored normally) and '
        '"nutrition" ({"per": "100 g", "calories": number, "protein_g": number, "carbs_g": number, "fat_g": number}).'
    )
    try:
        est = extract_json(ask_nova(prompt, 500), "{", "}")
    except Exception:
        est = {"shelfLifeDays": 7}
    item = make_item(
        user_id, name, data.get("quantity", 1), data.get("unit", "each"),
        data.get("category", "other"), est.get("shelfLifeDays", 7), est.get("nutrition"),
    )
    table.put_item(Item=to_dynamo(item))
    return response(200, {"item": item})

def edit_item(user_id, item_id, data):
    existing = table.get_item(Key={"userId": user_id, "itemId": item_id}).get("Item")
    if not existing:
        return response(404, {"error": "Item not found"})
    existing = clean(existing)
    for k in EDITABLE:
        if k in data:
            existing[k] = data[k]
    existing["edited"] = True
    table.put_item(Item=to_dynamo(existing))
    return response(200, {"item": existing})

def simulate(user_id, data):
    days = int(data.get("days", 3))
    table.put_item(Item={"userId": user_id, "itemId": META_ID, "offsetDays": days})
    return response(200, {"offsetDays": days, "asOf": (date.today() + timedelta(days=days)).isoformat()})

def reset(user_id):
    resp = table.query(KeyConditionExpression=Key("userId").eq(user_id))
    with table.batch_writer() as batch:
        for i in resp["Items"]:
            batch.delete_item(Key={"userId": user_id, "itemId": i["itemId"]})
    table.put_item(Item={"userId": user_id, "itemId": META_ID, "offsetDays": 0})
    with table.batch_writer() as batch:
        for name, qty, unit, cat, days in DEMO_ITEMS:
            batch.put_item(Item=to_dynamo(make_item(user_id, name, qty, unit, cat, days)))
    return response(200, {"ok": True})

def generate_recipe(user_id):
    items = clean(list_items(user_id))
    if not items:
        return response(400, {"error": "Inventory is empty"})
    today = today_for(user_id)
    lines = []
    for i in items:
        days_left = (date.fromisoformat(i["expirationDate"]) - today).days
        lines.append(f'- itemId={i["itemId"]}: {i["name"]}, {i["quantity"]} {i["unit"]}, expires in {days_left} days')
    prompt = (
        "You are a home cooking assistant. Here is what's in the user's kitchen:\n"
        + "\n".join(lines)
        + "\n\nCreate ONE realistic recipe that uses the items expiring soonest. "
        "Ignore items with negative days (already expired). You may also assume basic staples "
        "(oil, salt, pepper, water). Return ONLY a JSON object with keys:\n"
        '"title" (string), "servings" (integer), "timeMinutes" (integer),\n'
        '"usesItemIds" (array of itemIds from the list above that the recipe uses),\n'
        '"ingredients" (array of {"name": string, "amount": string, "itemId": string or omit if a staple}),\n'
        '"steps" (array of plain strings, one action each, written to be read aloud, no markdown, no "see above").'
    )
    recipe = extract_json(ask_nova(prompt, 2500), "{", "}")
    recipe["recipeId"] = "rcp_" + uuid.uuid4().hex[:8]
    return response(200, {"recipe": recipe})

def speak(data):
    text = data.get("text", "")
    if not text:
        return response(400, {"error": "No text"})
    out = polly.synthesize_speech(
        Text=text, OutputFormat="mp3", VoiceId=data.get("voice", "Joanna"), Engine="neural"
    )
    audio = base64.b64encode(out["AudioStream"].read()).decode()
    return response(200, {"audio": audio})

def check_notifications(user_id):
    today = today_for(user_id)
    items = clean(list_items(user_id))
    expiring = [i for i in items if 0 <= (date.fromisoformat(i["expirationDate"]) - today).days <= 2]
    emailed = False
    if expiring:
        lines = []
        for i in expiring:
            d = (date.fromisoformat(i["expirationDate"]) - today).days
            when = "today" if d == 0 else ("tomorrow" if d == 1 else f"in {d} days")
            lines.append(f"- {i['name']} expires {when}")
        sns.publish(
            TopicArn=TOPIC_ARN,
            Subject=f"{len(expiring)} items expiring soon",
            Message="Use these before they go bad:\n\n" + "\n".join(lines)
            + "\n\nOpen the app for a recipe that uses them.",
        )
        emailed = True
    return response(200, {"expiringCount": len(expiring), "emailed": emailed, "items": expiring})

# ---------- router ----------

def lambda_handler(event, context):
    try:
        method = event["requestContext"]["http"]["method"]
        path = event.get("rawPath", "/")
        if method == "OPTIONS":
            return response(204)

        params = event.get("queryStringParameters") or {}
        user_id = params.get("userId", "demo")
        body = event.get("body") or "{}"
        if event.get("isBase64Encoded"):
            body = base64.b64decode(body).decode()
        data = json.loads(body) if body.strip() else {}

        parts = [p for p in path.split("/") if p]

        if parts == ["inventory"] and method == "GET":
            return response(200, {"asOf": today_for(user_id).isoformat(), "items": list_items(user_id)})
        if parts == ["inventory"] and method == "POST":
            return add_item(user_id, data)
        if len(parts) == 2 and parts[0] == "inventory" and method == "PATCH":
            return edit_item(user_id, parts[1], data)
        if len(parts) == 2 and parts[0] == "inventory" and method == "DELETE":
            table.delete_item(Key={"userId": user_id, "itemId": parts[1]})
            return response(200, {"ok": True})
        if parts == ["demo", "simulate"] and method == "POST":
            return simulate(user_id, data)
        if parts == ["demo", "reset"] and method == "POST":
            return reset(user_id)
        if parts == ["recipes", "generate"] and method == "POST":
            return generate_recipe(user_id)
        if parts == ["speak"] and method == "POST":
            return speak(data)
        if parts == ["notifications", "check"] and method == "POST":
            return check_notifications(user_id)

        return response(404, {"error": f"No route for {method} {path}"})
    except Exception as e:
        return response(500, {"error": str(e)})
