# ResumeForge

ResumeForge is an ATS-friendly resume builder SaaS built as a monorepo with:

- `apps/web`: Next.js frontend (App Router)
- `apps/api`: FastAPI backend
- `packages/shared`: shared TypeScript resume schema

It supports resume editing, AI-assisted optimization, template-based preview/export, auth, and password reset.

## Highlights

- Resume CRUD, duplicate, and version history
- AI keyword extraction, score, and rewrite suggestions
- Multiple resume templates for preview and PDF export
- Export to PDF (WeasyPrint with fallback) and DOCX
- Email/password auth with JWT
- Forgot password / reset password flow
- Template metadata API for frontend template selector

## Architecture

```text
Browser (Next.js UI)
  -> REST API (Bearer JWT)
FastAPI Routes
  -> Services (resume, ai, export, email)
    -> SQLAlchemy Models + DB
    -> AI providers (OpenAI / Anthropic / Ollama / fallback)
    -> Export engines (WeasyPrint + ReportLab fallback + DOCX)
```

## Repository Layout

```text
.
|- apps/
|  |- api/
|  |  |- app/
|  |  |  |- api/routes/
|  |  |  |- core/
|  |  |  |- db/
|  |  |  |- models/
|  |  |  |- schemas/
|  |  |  |- services/
|  |  |  |  |- ai/
|  |  |  |  `- exporters/
|  |  |  `- utils/
|  |  |- alembic/
|  |  |- scripts/
|  |  `- tests/
|  `- web/
|     |- app/
|     |- components/
|     |- lib/
|     `- types/
|- packages/
|  `- shared/src/
|- docker-compose.yml
`- DEPLOYMENT.md
```

## Tech Stack

- Frontend: Next.js 14, React 18, TypeScript, Tailwind CSS
- Backend: FastAPI, SQLAlchemy, Alembic
- DB: MySQL / PostgreSQL / SQLite
- Auth: JWT bearer
- AI: OpenAI, Anthropic, Ollama, deterministic fallback
- Export: WeasyPrint, ReportLab fallback, python-docx

## Prerequisites

- Node.js 18+ and npm
- Python 3.11+ (3.12 works)
- Database (SQLite local default, or MySQL/PostgreSQL)

## Quick Start

### Option A: One command (Windows PowerShell)

From repo root:

```powershell
.\run_dev.ps1
```

Starts API and web in separate terminals.

- API health: `http://127.0.0.1:8000/api/v1/health`
- Web: `http://localhost:3000`

### Option B: Manual Start

1. Backend

```bash
cd apps/api
python -m pip install -r requirements.txt
copy .env.example .env
python -m alembic upgrade head
python scripts/seed.py
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

2. Frontend (from repo root)

```bash
npm install
copy apps/web/.env.example apps/web/.env.local
npm --workspace apps/web run dev
```

## Environment Files

- API: `apps/api/.env`
- Web: `apps/web/.env.local`

Production examples:

- `apps/api/.env.production.example`
- `apps/web/.env.production.example`

## Main API Routes (`/api/v1`)

- Health: `GET /health`
- Auth:
  - `POST /auth/register`
  - `POST /auth/login`
  - `POST /auth/forgot-password`
  - `POST /auth/reset-password`
- Resumes:
  - `POST /resumes`
  - `GET /resumes`
  - `GET /resumes/{id}`
  - `PUT /resumes/{id}`
  - `DELETE /resumes/{id}`
  - `POST /resumes/{id}/duplicate`
- AI:
  - `POST /ai/extract-keywords`
  - `POST /ai/rewrite-summary`
  - `POST /ai/rewrite-bullet`
  - `POST /ai/score-resume`
  - `GET /ai/providers/status`
- Templates:
  - `GET /templates`
- Export:
  - `POST /export/pdf`
  - `POST /export/docx`

## Template & Export Notes

- Backend template registry: `apps/api/app/services/exporters/template_registry.py`
- Template folders: `apps/api/app/services/exporters/templates/*`
- Current templates:
  - `ats_classic`
  - `modern_sidebar`
  - `executive_clean`
- PDF flow:
  - WeasyPrint (preferred)
  - ReportLab fallback if WeasyPrint runtime libs are unavailable

## Database Inspection

Use the helper script from `apps/api`:

```bash
python scripts/db_inspect.py
```

Specific tables:

```bash
python scripts/db_inspect.py --tables users resumes exports
```

This prints:

- active DB URL (password masked)
- table list
- row counts

## Tests

Backend:

```bash
cd apps/api
python -m pytest
```

Web lint:

```bash
npm --workspace apps/web run lint
```

## Deployment

See: [DEPLOYMENT.md](./DEPLOYMENT.md)

## Troubleshooting

### `POST /api/v1/export/pdf` returns `400`

- Ensure template id is valid (`ats_classic`, `modern_sidebar`, `executive_clean`).
- Backend includes compatibility fallback for old template ids.

### WeasyPrint GTK/lib errors on Windows

- API will fall back to ReportLab for PDF.
- For full WeasyPrint output quality, install required system libraries.

### Password reset email not sent

- Configure SMTP settings in `apps/api/.env`.
- Without SMTP in production, reset email delivery will fail.

### `Invalid authentication token`

- Log in again to refresh JWT.
- Confirm API URL and CORS origins are correct.

## Security Notes

- Do not commit real `.env` files.
- Set strong `JWT_SECRET_KEY` in production.
- Keep `DEBUG=false` in production.
- Configure SMTP and frontend origins correctly before going live.
