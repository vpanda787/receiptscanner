# TASKS — DubHacks '26

Status: `todo` · `doing` · `done` · `cut`. Paste this file when asking any Claude for help.
Update at every checkpoint.

## Revised timeline (backend finished 2:51 PM; VEYZL side track cut)
| By | Done when |
|---|---|
| 4:30 PM | Scan tested against live API; PR #2 merged; Amplify deploying with VITE_API_BASE |
| 5:30 PM | Upload → inventory → recipe → voice works on the deployed site |
| 6:30 PM | Domain live; demo data decided and rehearsed; phone test done |
| 8:30 PM | Draft Devpost submitted (deadline 10:30 PM) |
| 2:00 AM | Polish, voice commands, simulated alert rehearsed; video storyboard |
| 5:30 AM | Feature freeze (unchanged) |

## Setup (due Sat 2:30 PM)
| Task | Owner | Status |
|---|---|---|
| Shared AWS account, IAM user for Varad, region with Bedrock (us-east-1), model access | Advait | done |
| Billing alarm at $10; confirm Textract in region | Advait | confirm |
| Public GitHub repo (vpanda787/receiptscanner), branch protection on main | Varad | doing |
| .gitignore covers .env and AWS keys | Varad | done (in starter) |
| Create Devpost project, invite Advait | Varad | todo |
| Register domain via MLH GoDaddy Registry offer | Varad | todo |
| Amplify app connected to repo, pointed at domain | Varad | todo |

## Backend (Advait)
| Task | Status |
|---|---|
| S3 bucket + Textract AnalyzeExpense Lambda | done |
| Bedrock normalization (name, qty, category, shelf life) | done |
| DynamoDB inventory table | done |
| API Gateway + CORS, all endpoints live (2:51 PM, ahead of 6 PM) | done |
| Recipe Lambda (soonest-expiring first, steps as array) | done |
| EventBridge daily check + SNS email; simulate-days endpoint | done |
| /speak endpoint (Polly → MP3) | done |
| Test real crumpled receipts end to end through the app | todo (with Varad) |
| PATCH accepts expirationDate + edited | done |
| API Gateway throttling (public, unauthenticated API) | todo |

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
| Swap mock → live API, reconcile contract | todo (now) |
| Polly via /speak live | todo (now) |
| Demo account pre-loaded with inventory | todo |
| Editable expiration dates + "estimated" label (optional, recommended) | todo |
| Freshness bars on a fixed 7-day window | todo |

## Side tracks
VEYZL: cut (couldn't detect the Bedrock AI in the repo). Still entering SideShift, MLH Commit Fellowship, MLH GoDaddy domain.

## Submission (Varad, with Advait)
| Task | Due | Status |
|---|---|---|
| Draft Devpost (overview + tracks) | Sat 10:30 PM | todo |
| Video < 3 min recorded + uploaded | Sun 6:00 AM | todo |
| Commit Fellowship supplemental form | Sun 9:30 AM | todo |
| Final submit with repo + live site links | Sun 9:30 AM | todo |
