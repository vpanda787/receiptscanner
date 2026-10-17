# TASKS — DubHacks '26

Status: `todo` · `doing` · `done` · `cut`. Paste this file when asking any Claude for help.
Update at every checkpoint.

## Setup (due Sat 2:30 PM)
| Task | Owner | Status |
|---|---|---|
| Shared AWS account, IAM user for Varad, region with Bedrock, model access requested | Advait | doing |
| Billing alarm at $10; confirm Textract in region | Advait | doing |
| Public GitHub repo, branch protection on main | Varad | todo |
| .gitignore covers .env and AWS keys | Varad | done (in starter) |
| Connect VEYZL to the repo | Varad | todo |
| Create Devpost project, invite Advait | Varad | todo |
| Register domain via MLH GoDaddy Registry offer | Varad | todo |
| Amplify app connected to repo, pointed at domain | Varad | todo |

## Backend (Advait)
| Task | Status |
|---|---|
| S3 bucket + Textract AnalyzeExpense Lambda | doing |
| Bedrock normalization (name, qty, category, shelf life) | todo |
| DynamoDB inventory table | todo |
| API Gateway + CORS, endpoint list handed to Varad by 6 PM | todo |
| Recipe Lambda (soonest-expiring first, steps as array) | todo |
| EventBridge daily check + SNS email; simulate-days endpoint | todo |
| /speak endpoint (Polly → MP3) | todo — confirm owner at 6 PM sync |

## Frontend (Varad)
| Task | Status |
|---|---|
| App scaffold with mock API layer | done (starter) |
| Receipt upload screen (camera/photo, client-side resize) | done (starter, mock) |
| Inventory list sorted by expiration, color + text for urgency | done (starter, mock) |
| Add/edit/delete items manually (name, qty, unit, category) | done (starter, mock) |
| Recipe screen showing which expiring items it uses | done (starter, mock) |
| "Simulate 3 days later" button | done (starter, mock) |
| Cook mode: step-by-step, next/back/repeat, speaks each step | done (starter, browser voice) |
| Voice commands via SpeechRecognition (bonus) | done (starter) |
| Swap mock → live API, reconcile contract | todo (6 PM) |
| Polly via /speak live | todo (after endpoint exists) |
| Demo account pre-loaded with inventory | todo |

## VEYZL (Varad)
| Task | Status |
|---|---|
| PR #1: app with AI expiration dates, no oversight — capture audit flag | todo |
| PR #2: editable dates + disclaimer + `edited` flag — capture passing check | todo |
| Screenshots of both saved to docs/veyzl/ | todo |

## Submission (Varad, with Advait)
| Task | Due | Status |
|---|---|---|
| Draft Devpost (overview + tracks) | Sat 10:30 PM | todo |
| Video < 3 min recorded + uploaded | Sun 6:00 AM | todo |
| Commit Fellowship supplemental form | Sun 9:30 AM | todo |
| Final submit with repo + live site links | Sun 9:30 AM | todo |
