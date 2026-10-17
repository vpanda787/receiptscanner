# Shelf Life

Scan a grocery receipt, track what's in your pantry and when it expires, get alerts before food goes
bad, and cook recipes built around what expires first — with a hands-free voice walkthrough.

DubHacks '26 · Cook Smarter track · Varad (frontend, voice) & Advait (AWS backend)

## Run the frontend
```bash
cd frontend
npm install
cp .env.example .env.local   # leave VITE_API_BASE empty to use mock data
npm run dev                  # http://localhost:5173
```

## Repo map
- `frontend/` — React + Vite app (deployed on AWS Amplify)
- `backend/` — AWS Lambdas and infrastructure
- `docs/API_CONTRACT.md` — the endpoints the frontend expects
- `TASKS.md` — who's doing what, by checkpoint
- `CLAUDE.md` — project context for Claude Code
