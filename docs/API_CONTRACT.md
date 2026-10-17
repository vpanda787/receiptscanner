# API contract (proposal from frontend — reconcile at the 6 PM sync)

Base URL: API Gateway stage URL, set in the frontend as `VITE_API_BASE`.
All requests and responses are JSON unless noted. CORS must allow the Amplify domain (or `*`
for the hackathon), methods GET/POST/PATCH/DELETE/OPTIONS, header `Content-Type`.

User scoping: every request carries `?userId=<id>` as a query parameter (the demo uses `demo`).
No auth for the hackathon. Using a query param instead of a custom header avoids extra CORS config.

Dates are `YYYY-MM-DD` strings.

## Item
```json
{
  "itemId": "itm_123",
  "name": "Chicken breast",
  "rawText": "GV ORG BNLS CHKN",
  "quantity": 1.5,
  "unit": "lb",
  "category": "meat",
  "purchaseDate": "2026-10-17",
  "expirationDate": "2026-10-19",
  "edited": false,
  "nutrition": { "per": "100 g", "calories": 165, "protein_g": 31, "carbs_g": 0, "fat_g": 3.6 }
}
```
Categories: `produce | dairy | meat | seafood | bakery | pantry | frozen | other`.
`nutrition` is optional; the frontend shows it when present. Cheapest way to fill it: ask Bedrock
for it in the same normalization call that estimates shelf life.

## Endpoints

| Method & path | Body | Returns |
|---|---|---|
| `GET /inventory` | — | `{ "asOf": "YYYY-MM-DD", "items": [Item] }` sorted by `expirationDate` ascending. `asOf` is "today" including any simulated offset. |
| `POST /inventory` | `{ name, quantity, unit, category }` | `{ "item": Item }` (backend estimates dates) |
| `PATCH /inventory/{itemId}` | any subset of Item fields | `{ "item": Item }` |
| `DELETE /inventory/{itemId}` | — | `204` or `{ "ok": true }` |
| `POST /receipts` | `{ "image": "<base64, no data: prefix>", "contentType": "image/jpeg" }` | `{ "receiptId": "...", "items": [Item] }` — decode → (optionally save to S3) → Textract AnalyzeExpense → Bedrock → saved to DynamoDB |
| `POST /recipes/generate` | `{}` | `{ "recipe": Recipe }` |
| `POST /notifications/check` | — | `{ "expiringCount": 3, "emailed": true, "items": [Item] }` items expiring within 2 days of `asOf` |
| `POST /demo/simulate` | `{ "days": 3 }` | `{ "offsetDays": 3, "asOf": "YYYY-MM-DD" }` — shifts "today" for this user |
| `POST /demo/reset` | — | `{ "ok": true }` — restore demo inventory, offset 0 |
| `POST /speak` | `{ "text": "...", "voice": "Joanna" }` | `{ "audio": "<base64 MP3>" }` (Polly SynthesizeSpeech, OutputFormat mp3) |

Receipt upload is decided: **base64 JSON to `POST /receipts`, not presigned S3 URLs.** The frontend
shrinks every photo to a JPEG of at most 1600 px on the long side before encoding (typically well under
1 MB), and refuses anything over 4 MB, so the body stays far below the API Gateway and Lambda payload
limits. In the Lambda: `json.loads(event["body"])`, `base64.b64decode(body["image"])`, and pass the bytes
to Textract `AnalyzeExpense` as `Document={"Bytes": ...}`. Saving the image to S3 is optional (useful
for debugging and the demo). No binary media types config is needed in API Gateway since the body is JSON.

## Recipe
```json
{
  "recipeId": "rcp_1",
  "title": "Chicken and spinach quesadillas with cilantro yogurt",
  "servings": 2,
  "timeMinutes": 25,
  "usesItemIds": ["itm_spinach", "itm_chicken"],
  "ingredients": [
    { "name": "Chicken breast", "amount": "1 lb", "itemId": "itm_chicken" },
    { "name": "Olive oil", "amount": "1 tbsp" }
  ],
  "steps": ["Slice the chicken into thin strips.", "..."]
}
```
`steps` must be an array of plain strings, one action each, written to be read aloud
(no "see above", no markdown).
