# Moody

Full-stack wellbeing app with Flask + Angular + PostgreSQL. The API contract is defined via Flask-Smorest/OpenAPI; the Angular client is generated from `backend/openapi.yaml`.

## Prerequisites
- Python 3.11+
- Node.js 18+ (with npm)
- PostgreSQL 14+

## Step-by-step: run locally

### 1) Create a local database
Create a PostgreSQL database and user (example below uses `postgres` user):
```bash
createdb moody
```

### 2) Backend setup (Flask API)
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Set environment variables (example):
```bash
export DATABASE_URL="postgresql+psycopg2://postgres:postgres@localhost:5432/moody"
export SECRET_KEY="change-me-to-a-long-random-string"
```

Initialize the database with migrations:
```bash
flask db upgrade
```

Seed journal prompts (optional):
```bash
python3 seeds/journal_prompt_seed.py
```

Run the API:
```bash
python3 run.py
```
API runs at `http://localhost:5000`

### 3) Frontend setup (Angular)
```bash
cd ../frontend
npm install
npm start
```
App runs at `http://localhost:4200`

## Database migrations (Flask-Migrate)
If you update models, generate a migration:
```bash
cd backend
source .venv/bin/activate
export DATABASE_URL="postgresql+psycopg2://postgres:postgres@localhost:5432/moody"
export SECRET_KEY="change-me-to-a-long-random-string"

flask db migrate -m "describe change"
flask db upgrade
```

## Production notes (AWS)
- Use PostgreSQL on AWS RDS and run `flask db upgrade` against the RDS `DATABASE_URL`.
- Set `JWT_COOKIE_SECURE=true` and `JWT_COOKIE_SAMESITE=None` for HTTPS deployments.
- Configure CORS to only allow your deployed frontend origin.
- The PWA offline cache is read-only (cached GETs + queued writes while app is open).

## Regenerating API client
After updating `backend/openapi.yaml`, regenerate the Angular client from `/frontend`:
```bash
npm run generate:api
```
This overwrites `src/app/api` with the latest contract (auth, moods, journals, habits, planner).
