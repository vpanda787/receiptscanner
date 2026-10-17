# Devpost draft — submit overview + tracks by Sat 10:30 PM

## Tagline
Scan your receipt, know what expires first, and cook it before it goes bad.

## Inspiration
Recipes never use ingredients in the proportions stores sell them. You buy a bunch of cilantro for one
dish and a tub of yogurt for another, and a week later half of it is in the trash. We wanted an app that
remembers what you bought, knows when it goes bad, and tells you what to cook with it while it's still good.

## What it does
- Snap a photo of a grocery receipt. Textract reads the line items; Bedrock turns abbreviations like
  "GV ORG BNLS CHKN" into "chicken breast" and estimates quantity, category, and shelf life.
- Your pantry lists everything sorted by what expires first, with clear warnings for items about to turn.
- A daily check emails you when something expires within two days.
- One tap generates a recipe built around your soonest-expiring items.
- Cook mode reads each step aloud with Amazon Polly. Say "next", "back", or "repeat" and keep your
  hands on the cutting board.

## How we built it
TODO (after 9 PM): React + Vite on AWS Amplify; API Gateway → Lambda; S3 + Textract AnalyzeExpense;
Bedrock (model: TODO); DynamoDB; EventBridge daily schedule → SNS email; Polly. Architecture slide: TODO.

## Challenges
TODO: real crumpled receipts, abbreviation normalization, shelf-life estimates, voice recognition
hearing its own audio, …

## Accomplishments / What we learned
TODO

## What's next
Nutrition per item, barcode scanning for exact products, shared household pantries, smarter quantity
tracking as you cook.

## Side tracks (one sentence each)
- **VEYZL:** TODO — what the audit caught (AI expiration dates with no human oversight) and how PR #2 fixed it.
- **SideShift (Best Startup Idea):** TODO — who pays (e.g. grocers as a loyalty feature, or a premium
  household tier) and how it spreads (shared household pantries, receipt scanning at checkout).
- **MLH GoDaddy domain:** TODO domain name.
- **MLH Commit Fellowship:** supplemental form submitted (TODO confirm).

## Links
- Repo: TODO
- Live site: TODO
- Video: TODO

## Video script (< 3 min)
1. Problem (20 s): leftover ingredients, food waste stat (find a sourced one).
2. Live demo (100 s): scan receipt → pantry → "Simulate 3 days later" → alert email → make recipe →
   cook mode with voice.
3. Architecture slide (25 s).
4. VEYZL before/after (25 s).
