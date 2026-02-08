# Moody

Full-stack wellbeing app with Flask + Angular + PostgreSQL. The API contract is defined via Flask-Smorest/OpenAPI; the Angular client is generated from `backend/openapi.yaml`.

## Database
- Target database: **PostgreSQL** (see `backend/app/config.py` for DSN).
- The repo no longer ships a SQLite file. For local prototyping you may enable `AUTO_CREATE_DB=1` to let Flask create tables, but production/staging should be managed via migrations or an external schema tool.

## Regenerating API client
After updating `backend/openapi.yaml`, regenerate the Angular client from `/frontend`:
```bash
npm run generate:api
```
This overwrites `src/app/api` with the latest contract (auth, moods, journals, habits, planner).
