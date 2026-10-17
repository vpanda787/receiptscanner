# Shelf Life — DubHacks '26 (Cook Smarter track)

An app that keeps groceries from going to waste: scan a receipt → pantry inventory with
expiration dates → expiring-soon alerts → a recipe built around what expires first →
a hands-free voice walkthrough of that recipe. ("Shelf Life" is a working name; it lives in
`frontend/src/config.js` as APP_NAME.)

## Team and ownership
- **Varad (me, using this Claude Code session):** everything in `frontend/`, the voice
  walkthrough, VEYZL evidence, Devpost write-up, and demo video.
- **Advait:** everything behind the API in `backend/` — S3, Textract, Bedrock, DynamoDB,
  Lambda, API Gateway, EventBridge, SNS, Polly. Do not edit `backend/` unless I explicitly ask.

## Hard deadlines (Seattle time)
- Sat 6:00 PM: backend endpoints handed over; swap mock → live API
- Sat 9:00 PM: upload → inventory → recipe works in the deployed app
- Sat 10:30 PM: draft Devpost submitted (mandatory)
- Sun 2:00 AM: Polly walkthrough + simulated alert working; first VEYZL fix merged
- Sun 5:30 AM: feature freeze — bug fixes only after this
- Sun 10:00 AM: Devpost hard lock (aim for 9:30)

When a task threatens a checkpoint, say so and suggest what to cut. Do not gold-plate.

## Frontend stack
- React 18 + Vite 5, plain CSS (`frontend/src/styles.css`, design tokens on `:root`). No UI library.
- Deployed on AWS Amplify Hosting from `main` (monorepo; `amplify.yml` sets appRoot=frontend).
- Commands (run from `frontend/`): `npm install`, `npm run dev`, `npm run build`.

## How the API layer works
- All network calls go through `frontend/src/api/index.js`. Components never call `fetch` directly.
- If `VITE_API_BASE` is unset (or `VITE_USE_MOCK=true`), calls go to `frontend/src/api/mock.js`,
  an in-memory fake backend seeded with demo inventory. A "Mock data" badge shows in the header.
- `docs/API_CONTRACT.md` is the agreed shape of every endpoint. If Advait's real responses differ,
  adapt them in `api/index.js` (the `normalize*` helpers) rather than changing every component.
- Receipt upload is decided: one `POST /receipts` with the photo as base64 JSON. Do not switch to
  presigned S3 URLs or multipart uploads.
- Environment variables live in `frontend/.env.local` (gitignored). Only `VITE_`-prefixed values
  reach the browser, so never put AWS keys in the frontend — the browser only ever talks to API Gateway.

## Data shapes (see docs/API_CONTRACT.md for full detail)
- Item: `{ itemId, name, rawText, quantity, unit, category, purchaseDate, expirationDate, edited, nutrition? }`
  Dates are `YYYY-MM-DD` strings.
- Recipe: `{ recipeId, title, servings, timeMinutes, usesItemIds[], ingredients[{name, amount, itemId?}], steps[] }`
  `steps` is an array of plain strings — the voice walkthrough reads them one at a time.

## Voice
- `frontend/src/voice/speak.js`: asks the backend `/speak` endpoint (Polly) for MP3 audio and
  falls back to the browser's speechSynthesis if that fails or we're in mock mode.
- `frontend/src/voice/commands.js`: optional voice commands (next / back / repeat / stop) via the
  browser's SpeechRecognition (Chrome/Edge/Safari). Results are ignored while audio is playing so
  the app doesn't hear itself.

## VEYZL sequencing — read before touching item editing
The plan is: PR #1 ships expiration dates as AI-estimated values the user cannot edit and with no
disclaimer. We expect the VEYZL audit to flag that (AI output with no human oversight). PR #2 is the
fix: editable expiration dates, an "estimated" disclaimer, and setting `edited: true` on manual changes.
**Do not add expiration-date editing or the disclaimer until I ask for PR #2.** The exact spec for the
fix is in docs/VEYZL.md.

## Conventions
- `main` is protected. Work on a branch and open a PR; never push to main directly.
- Never read, print, or commit `.env` files or AWS credentials.
- Keep `TASKS.md` current: when something finishes, propose the status update.
- Accessibility floor: visible keyboard focus, buttons are real `<button>`s, color is never the only
  signal (expiry also shows as text), respects prefers-reduced-motion and dark mode.
- UI copy: sentence case, plain verbs, buttons say exactly what they do.
