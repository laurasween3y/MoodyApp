# Moody

Wellbeing tracker built with Angular 17 and a Flask + PostgreSQL API. JWT (HS256) secures requests; the Angular client is generated from the project’s OpenAPI spec.

## Project Overview
- Track moods, habits, journals (rich text + prompts), and planner events with reminders.
- View dashboard streaks/achievements and manage notification preferences.
- Offline-friendly: cached reads and queued writes that replay when the browser comes back online.

## Architecture (text)
```
[Angular 17 SPA]
  - Standalone pages (Home, Mood, Habits, Journal, Planner, Profile, Auth)
  - OpenAPI client + JWT interceptor
  - Offline write queue (IndexedDB → localStorage fallback)
  - Browser + in-app reminders (no push)
  - Service worker active in production builds
        |
        v
[Flask API (Flask-Smorest, JWT HS256)]
  - Blueprints: /auth, /moods, /habits, /journals, /planner,
    /progress, /profile, /notification-settings, /affirmations,
    /journal-prompts, /uploads/*
  - SQLAlchemy + Alembic → PostgreSQL
  - Local disk uploads for journal covers
Hosting: Frontend on S3; backend Docker on EC2 (container port 5000)
```

## Tech Stack
- Frontend: Angular 17, TypeScript, Angular Router/Forms, TipTap editor, Angular Service Worker, OpenAPI TS client.
- Backend: Flask, Flask-Smorest, SQLAlchemy, Flask-Migrate, Marshmallow, Flask-CORS, PyJWT, bcrypt.
- DB: PostgreSQL.
- Auth: JWT (24h) stored in `localStorage`; blacklist for logout.

## Implemented Features
- Auth: register/login/logout; token blacklist on logout.
- Mood: create/update/delete, today endpoint, calendar view; mood options from API.
- Habits: CRUD, set/unset/toggle completions, weekly progress, streak/achievement awarding.
- Journals: multiple journals, entries with TipTap formatting, prompts, cover upload (png/jpeg/webp ≤5 MB) stored on server disk.
- Planner: CRUD events with optional time + `reminder_minutes_before`; calendar + list views; static holiday overlay.
- Progress: achievements (mood/habit/journal/planner) and streak summaries (mood & habit) exposed via `/progress`.
- Profile: update email/password; view achievements; manage reminder settings; send test notification.
- Notifications: client-side timers for daily mood/habit and planner reminders; Web Notifications when granted plus in-app toasts.
- Offline: cached assets/GET data (production build); write queue stored in IndexedDB with localStorage fallback and replay on reconnect; local caches for moods/habits/journals/entries/events.

## API Overview (blueprints)
- `/auth`: register, login (returns JWT + cookie), logout (blacklists token).
- `/moods`: list, create, today get/create, get by id, update, delete; `/options`.
- `/habits`: CRUD; `/toggle`; `/completions/{date}` set/unset.
- `/journals`: CRUD; `/cover` upload; `/entries` CRUD.
- `/planner/events`: list (optional `date`), create, update, delete.
- `/progress`: `/streaks`, `/achievements`.
- `/profile`: get/update email/password.
- `/notification-settings`: get/update reminder toggles/times.
- `/affirmations`: random affirmation with fallback.
- `/journal-prompts/random`: random prompt.
- `/uploads/<file>`: serve stored covers.

## Local Setup (concise)
1) **Database**
   ```bash
   createdb moody   # Postgres on localhost:5432
   ```
2) **Backend**
   ```bash
   cd backend
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   export DATABASE_URL="postgresql+psycopg2://postgres:postgres@localhost:5432/moody"
   export SECRET_KEY="dev-change-me"
   export FLASK_APP=run.py
   flask db upgrade
   flask run --port 5001    # 5000 if you omit --port
   ```
   Docker alternative:
   ```bash
   docker build -t moody-api .
   docker run --rm -p 5001:5000 \
     -e FLASK_APP=run.py \
     -e DATABASE_URL="postgresql+psycopg2://postgres:postgres@host.docker.internal:5432/moody" \
     -e SECRET_KEY="dev-change-me" moody-api
   ```
3) **Frontend**
   ```bash
   cd frontend
   npm install
   # edit src/environments/environment.ts if API host/port differs (default http://localhost:5001)
   npm start -- --port 4200
   ```
4) Open http://localhost:4200 and register/login.

## Environment Configuration
- `DATABASE_URL` (required) — PostgreSQL URI.
- `SECRET_KEY` (required) — JWT signing.
- `FLASK_APP=run.py` — needed for `flask` CLI.
- Optional: `FRONTEND_ORIGIN` (adds to CORS allowlist), `JWT_COOKIE_NAME`, `JWT_COOKIE_SECURE`, `JWT_COOKIE_SAMESITE`, `JWT_COOKIE_MAX_AGE`.
- Frontend API base: `src/environments/environment.ts` (dev `http://localhost:5001`), `environment.prod.ts` (current `http://13.51.121.30`).  
- Service worker data groups in `ngsw-config.json` reference `http://localhost:5000`; update if you change the API host.

## Database
- Migrations live in `backend/migrations`; run `flask db upgrade` before first run.
- Seeds (optional): `python seeds/journal_prompt_seed.py`; richer demo data via `seeds/demo_seed.py` (see file header snippet).

## Running
- **Backend**: `flask run --port 5001` (or 5000 by default). Health check: `GET /healthz`.
- **Frontend**: `npm start -- --port 4200` (dev; no service worker).  
  Production build: `npm run build` → `frontend/dist/frontend/browser` (service worker enabled).

## Deployment
- Frontend: upload `frontend/dist/frontend/browser` to S3 (index/error = `index.html`); set `environment.prod.ts` to your API host.
- Backend: run Docker image on EC2 (container port 5000 mapped to your chosen host port) with `DATABASE_URL`, `SECRET_KEY`, `FLASK_APP`.
- Regenerate client after API changes: `cd frontend && npm run generate:api` (uses `backend/openapi.yaml`).

## Academic Integrity & AI Use Declaration
- AI assistance: this README was refined with OpenAI ChatGPT (GPT-5 via Codex) on 2026-03-03. GitHub Copilot was used for IDE suggestions during debugging and writing unit tests; all suggestions were reviewed and corrected by me.
- Code generation: the Angular API client is generated with OpenAPI Generator from `backend/openapi.yaml`.

## License
No license file present; all rights reserved by default. Add a license (e.g., MIT) before distribution.
