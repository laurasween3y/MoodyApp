# Moody

Wellbeing tracker with Angular 17 + Flask + PostgreSQL. Angular uses an OpenAPI-generated client against the Flask-Smorest API. Frontend is served from AWS S3; backend runs in Docker on EC2.

## README audit: issues found
- Ports in practice differ: frontend dev env targets `http://localhost:5001` while the old README said `5000`.
- Missing implemented features (planner, notifications, achievements, offline queue, uploads) and missing limitations (no push, no encryption, no GDPR retention).
- No architecture/hosting description; environment variables and hardcoded URLs not documented.
- Setup steps omitted migration/seeding caveats and did not explain Docker vs local runs.

---

## Project Overview
Moody lets users register, log moods, track habits, journal, plan events, and view streaks/achievements. It supports basic offline queuing for writes, browser reminders, and a PWA cache for GET requests.

## Architecture Diagram (text)
```
[Angular 17 SPA]
    |-- OpenAPI client (Auth, Moods, Habits, Journals, Planner, Profile, Progress, Notifications)
    |-- Service Worker (cache GETs) + offline write queue + local notifications
    V
[Flask API (Flask-Smorest, JWT HS256)]
    |-- SQLAlchemy models/migrations --> PostgreSQL
    |-- Local uploads folder (/uploads) for journal covers
Hosting:
    Frontend: S3 static website
    Backend: Docker on EC2 (ports 80/5000)
```

## Tech Stack
- Frontend: Angular 17 (standalone components), TypeScript, Angular Service Worker, OpenAPI-generated client
- Backend: Flask, Flask-Smorest, SQLAlchemy, Flask-Migrate, JWT (HS256), Marshmallow
- Database: PostgreSQL
- Auth: Bearer JWT stored in localStorage
- Deployment: AWS S3 (frontend), EC2 Docker (backend)

## Implemented Features
- User auth: register/login/logout with JWT (24h expiry, revocation list).
- Mood tracking: create/update daily moods, fetch today’s mood, list history.
- Habits: create/update/delete habits, toggle completions, streaks counted server-side.
- Journals: create/update/delete journals, CRUD entries, upload cover images to local `/uploads`.
- Planner: create/update/delete events with reminder minutes; weekly view on dashboard.
- Progress: streak summaries (mood, habit) and achievement badges (mood/habit/journal/planner).
- Profile: view/update email.
- Notifications: browser-based reminders for moods/habits and planner events (tab must stay open; permission required).
- Offline support: service worker caches assets + GET data groups; interceptor queues write requests when offline and replays when back online (in-memory queue).
- PWA: `ngsw-config.json` enabled; installable manifest.
- Affirmations: client-side service showing daily affirmation text.

## Partially Implemented
- Offline queue is in-memory only (lost on refresh; no background sync).
- Service worker data groups target `http://localhost:5000/*` and app-relative paths; not tuned for prod domains.
- Notifications are client-only (no push/Firebase); fire only while a tab is open.
- Uploads stored on EC2 disk; no S3 storage or CDN.
- No GDPR/data-retention automation; no encryption at rest for user data beyond DB defaults.
- No refresh tokens/rotation; single 24h JWT.

## Planned / Future Improvements
- Move uploads to S3 with signed URLs.
- Push notifications / background sync for reminders.
- Harden CORS (remove `*`, restrict to S3/CloudFront origin) and add rate limiting.
- Add refresh tokens/shorter access tokens.
- Add analytics/charts for mood/habit trends.
- Implement data retention/export/delete tooling.
- Persist offline queue and add retry backoff.

## API Overview (Blueprints)
- `/auth`: register, login, logout (JWT HS256, blacklist for logout).
- `/moods`: list, create, today get/create, update.
- `/habits`: CRUD, toggle/set/unset completions.
- `/journals`: CRUD, cover upload, entries CRUD.
- `/planner`: CRUD planner events (with reminder_minutes_before).
- `/progress`: streaks, achievements.
- `/profile`: get/update profile.
- `/notification-settings`: get/update reminder preferences.
- `/affirmations`: random affirmation.
- `/journal-prompts`: list prompts.
- `/uploads/<file>`: serve uploaded journal covers.

## Environment Configuration
- Backend (required): `DATABASE_URL` (PostgreSQL URI), `SECRET_KEY` (JWT signing).
- Backend (optional): `JWT_COOKIE_NAME`, `JWT_COOKIE_SECURE`, `JWT_COOKIE_SAMESITE`, `JWT_COOKIE_MAX_AGE`.
- Frontend: `frontend/src/environments/environment.ts` (dev, currently `http://localhost:5001`); `environment.prod.ts` (`http://13.51.121.30`). Update these if your backend runs on a different host/port.
- Hardcoded cache URLs: `ngsw-config.json` includes `http://localhost:5000/*` dataGroups; adjust if changing API host.

## Local Setup (step-by-step)
### 1) Database
```bash
createdb moody   # Postgres running locally on 5432
```

### 2) Backend (Python) — option A: native
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export DATABASE_URL="postgresql+psycopg2://postgres:postgres@localhost:5432/moody"
export SECRET_KEY="dev-secret-change-me"
# run on 5000 (default) or specify a port:
FLASK_APP=run.py flask run --port 5001  # matches frontend dev default
# or: python run.py  (runs on 5000; then set frontend env to 5000)
```

### 2B) Backend (Docker) — option B: matches frontend default
```bash
docker run -d --rm --name moody-api-local \
  -p 5001:5000 \
  -e DATABASE_URL="postgresql+psycopg2://postgres:postgres@host.docker.internal:5432/moody" \
  -e SECRET_KEY="dev-secret" \
  laurasween3y04/moody-image:0.1
```

### 3) Migrations
```bash
cd backend
source .venv/bin/activate   # if using venv
flask db upgrade
# Optional seed
python3 seeds/journal_prompt_seed.py
```

### 4) Frontend
```bash
cd frontend
npm install
# if your API is not on http://localhost:5001, edit src/environments/environment.ts
npm start -- --port 4200
```
Open http://localhost:4200 (dev server) and log in/register; API calls go to the `apiBaseUrl` in the environment file.

## Database Setup
- Uses PostgreSQL via SQLAlchemy. All migrations live in `/backend/migrations`.
- Required to run `flask db upgrade` before first launch against any DB (local or RDS).

## Running Backend
- Dev (Python): `FLASK_APP=run.py flask run --port 5001` (or 5000).
- Dev (Docker): `docker run -d --rm -p 5001:5000 ...`.
- Healthcheck: `GET /healthz`.

## Running Frontend
- Dev: `npm start -- --port 4200` (Angular uses `environment.ts`).
- Build prod bundle: `npm run build` outputs to `frontend/dist/frontend/browser`.

## Deployment Overview
- Frontend: upload `frontend/dist/frontend/browser` to S3 bucket root; static website hosting with index/error document `index.html`.
- Backend: Docker container on EC2 exposed on ports 80/5000 (current prod base URL `http://13.51.121.30`). Ensure SG allows the chosen port and CORS allows the S3 origin.
- API client regeneration (after OpenAPI changes): from `/frontend`, run `npm run generate:api`.

## Known Limitations
- JWT stored in `localStorage`; no refresh token flow.
- CORS currently allows `*` plus dev/prod origins; should be tightened for prod.
- Offline queue is volatile (lost on refresh) and only handles writes; no background sync.
- Service worker caches only configured GET endpoints and still references localhost URLs.
- Notifications require the tab to be open and permission granted; no push support.
- Uploads stay on EC2 disk; no backup/virus scanning.
- No automated data retention/GDPR tooling; no client-side encryption of journal data.

## Future Improvements
- Tighten CORS and add rate limiting/monitoring.
- Add push notifications, background sync, and persisted offline queue.
- Move uploads to S3; serve via CloudFront.
- Add trend charts/analytics and richer progress dashboards.
- Implement data export/retention policies and encryption at rest for sensitive fields.
- Add refresh tokens and configurable token lifetimes.

## License
No license file currently present; all rights reserved by default. Add an explicit license if you intend to distribute.
