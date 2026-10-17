import json, base64, uuid, boto3
from decimal import Decimal
from datetime import date, timedelta

textract = boto3.client("textract")
bedrock = boto3.client("bedrock-runtime")
table = boto3.resource("dynamodb").Table("Inventory")
MODEL_ID = "us.amazon.nova-pro-v1:0"
CATEGORIES = {"produce", "dairy", "meat", "seafood", "bakery", "pantry", "frozen", "other"}

def response(status, body):
    return {
        "statusCode": status,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Methods": "*",
        },
        "body": json.dumps(body),
    }

def to_dynamo(obj):
    # DynamoDB can't store normal decimals like 1.5, so convert them
    return json.loads(json.dumps(obj), parse_float=Decimal)

def lambda_handler(event, context):
    try:
        if "image" in event:
            # Console test
            data = event
            user_id = event.get("userId", "demo")
        else:
            # Real call from the frontend: POST /receipts?userId=demo
            params = event.get("queryStringParameters") or {}
            user_id = params.get("userId", "demo")
            body = event.get("body") or "{}"
            if event.get("isBase64Encoded"):
                body = base64.b64decode(body).decode()
            data = json.loads(body)

        image_bytes = base64.b64decode(data["image"])

        # 1. Read the receipt
        resp = textract.analyze_expense(Document={"Bytes": image_bytes})
        raw_items = []
        for doc in resp["ExpenseDocuments"]:
            for group in doc.get("LineItemGroups", []):
                for line in group.get("LineItems", []):
                    for f in line.get("LineItemExpenseFields", []):
                        if f["Type"]["Text"] == "ITEM":
                            raw_items.append(f["ValueDetection"]["Text"])

        if not raw_items:
            return response(200, {"items": [], "note": "No items found on receipt"})

        # 2. Clean up items, estimate shelf life + nutrition
        prompt = (
            "These are abbreviated line items from a grocery receipt:\n"
            + "\n".join(raw_items)
            + "\n\nReturn a JSON array with one object per line item, with these keys:\n"
            '"rawText": the line exactly as given above,\n'
            '"name": plain readable food name, e.g. "Chicken breast",\n'
            '"quantity": a number, default 1,\n'
            '"unit": e.g. "lb", "oz", "gal", "each",\n'
            '"category": one of produce, dairy, meat, seafood, bakery, pantry, frozen, other,\n'
            '"shelfLifeDays": integer, typical days until it goes bad if stored normally,\n'
            '"isFood": true or false (false for bags, tax, coupons, non-food),\n'
            '"nutrition": {"per": "100 g", "calories": number, "protein_g": number, "carbs_g": number, "fat_g": number}.\n'
            "Return ONLY the JSON array, nothing else."
        )
        out = bedrock.converse(
            modelId=MODEL_ID,
            messages=[{"role": "user", "content": [{"text": prompt}]}],
            inferenceConfig={"maxTokens": 3000, "temperature": 0},
        )
        text = out["output"]["message"]["content"][0]["text"]
        text = text[text.find("["): text.rfind("]") + 1]
        parsed = json.loads(text)

        # 3. Save to the Inventory table
        today = date.today()
        saved = []
        for it in parsed:
            if not it.get("isFood", True):
                continue
            category = it.get("category", "other")
            if category not in CATEGORIES:
                category = "other"
            item = {
                "userId": user_id,
                "itemId": "itm_" + uuid.uuid4().hex[:10],
                "name": it.get("name", "Unknown item"),
                "rawText": it.get("rawText", ""),
                "quantity": float(it.get("quantity") or 1),
                "unit": it.get("unit", "each"),
                "category": category,
                "purchaseDate": today.isoformat(),
                "expirationDate": (today + timedelta(days=int(it.get("shelfLifeDays") or 7))).isoformat(),
                "edited": False,
            }
            if isinstance(it.get("nutrition"), dict):
                item["nutrition"] = it["nutrition"]
            table.put_item(Item=to_dynamo(item))
            saved.append(item)

        return response(200, {"items": saved})

    except Exception as e:
        return response(500, {"error": str(e)})
