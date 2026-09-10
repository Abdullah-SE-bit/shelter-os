# Cat Connect 🐾

A cat welfare management platform for shelters: cat registry, intake/discharge, medical
records, vet appointments, adoption, fostering, lost & found, donations, messaging, and
analytics. Django REST API + React (Vite) single-page app.

---

## Tech stack

**Backend**
- Python + Django 6 / Django REST Framework
- PostgreSQL
- JWT auth (SimpleJWT, with token blacklisting)
- Celery + Redis + Celery Beat (background & scheduled jobs)
- drf-spectacular (OpenAPI / Swagger docs)

**Frontend**
- React 19 + Vite 8
- React Router 7, Axios
- Tailwind CSS 4
- Leaflet / React-Leaflet (maps)

---

## Prerequisites

Install these before you start:

| Tool | Version | Notes |
|------|---------|-------|
| Python | 3.12 or newer | Django 6 requires 3.12+ |
| Node.js | 20.19+ (LTS) or newer | Ships with npm; needed by Vite 8 |
| PostgreSQL | 13 or newer | The app's database |
| Git | any recent | To clone the repo |
| Redis | 6+ | **Optional** — only for background jobs (see below) |

> In development (`DEBUG=True`) Celery runs tasks synchronously, so you do **not** need
> Redis or a Celery worker just to run and demo the app.

---

## Project layout

```
Cat_Connect/
├─ backend/          # Django project (settings, urls, celery, wsgi/asgi)
├─ apps/             # 18 Django apps (accounts, cats, medical, wellness, adoption, ...)
├─ frontend/         # React + Vite app
├─ media/            # Uploaded files (created at runtime)
├─ manage.py         # Django entry point
├─ seed_db.py        # Optional: loads demo users + sample cats
├─ requirements.txt  # Python dependencies
└─ .env.example      # Template for your local .env
```

---

## Getting started

You'll run **two processes** side by side: the Django API (port 8000) and the Vite dev
server (port 5173). Use two terminals.

### 1. Clone

```bash
git clone https://github.com/Abdullah-SE-bit/Cat_Connect.git Cat_Connect
cd Cat_Connect
```

### 2. Backend (Django API)

**a. Create and activate a virtual environment** (run from the project root):

```bash
python -m venv venv
```

```bash
# Windows (PowerShell)
venv\Scripts\Activate.ps1
# Windows (cmd)
venv\Scripts\activate.bat
# macOS / Linux
source venv/bin/activate
```

**b. Install dependencies:**

```bash
pip install -r requirements.txt
```

**c. Create the PostgreSQL database** (any name — just match it in `.env`):

```bash
psql -U postgres -c "CREATE DATABASE pawtrack;"
```

**d. Create your `.env` file** in the project root and in frontend folder by copying the template:

```bash
# Windows
copy .env.example .env
# macOS / Linux
cp .env.example .env
```

Then edit `.env` of project root folder and set at least these values :

```env
SECRET_KEY=replace-with-any-long-random-string
DEBUG=True
DB_NAME=pawtrack
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_HOST=localhost
DB_PORT=5432
FRONTEND_URL=http://localhost:5173
```

edit `.env` of frontend folder and write this:

```env
VITE_API_BASE=http://127.0.0.1:8000/api/v1
```

> Keep `DEBUG=True` for local development. It makes verification/notification emails
> print to the backend terminal (no SMTP setup needed) and runs Celery tasks inline.

**e. Apply database migrations:**

```bash
python manage.py migrate
```

**f. Create an account to log in with.** Pick one:

```bash
# Option 1 (recommended for a quick demo): load demo users + sample cats
python seed_db.py

# Option 2: create your own super admin
python manage.py createsuperuser
```

> ⚠️ `seed_db.py` clears existing cats, shelters, and non-superuser accounts before
> seeding. Only run it on a fresh/throwaway database.

**g. Start the API server:**

```bash
python manage.py runserver
```

The API is now at **http://127.0.0.1:8000**.

### 3. Frontend (React app)

Open a **second terminal** in the project root:

```bash
cd frontend
npm install
npm run dev
```

The app is now at **http://localhost:5173**. It talks to the API at
`http://127.0.0.1:8000/api/v1` by default — no extra config needed.

### 4. Open the app

| What | URL |
|------|-----|
| Web app | http://localhost:5173 |
| API root | http://127.0.0.1:8000/api/v1/ |
| API docs (Swagger) | http://127.0.0.1:8000/api/docs/ |
| API docs (ReDoc) | http://127.0.0.1:8000/api/redoc/ |
| Django admin | http://127.0.0.1:8000/admin/ |

---

## Test accounts

If you ran `python seed_db.py`, these accounts exist (all password `admin123`):

| Email | Role |
|-------|------|
| admin@pawtrack.com | Super Admin |
| shelter@pawtrack.com | Shelter Admin |
| vet@pawtrack.com | Vet |
| volunteer@pawtrack.com | Volunteer |

**Start with `admin@pawtrack.com`** — the Super Admin is the only role exempt from the
email-verification check, so it can log in immediately.

The other seeded roles have unverified emails and will be blocked at login until verified.
Two easy ways to unblock them for testing:

- Log in as the Super Admin and use **Admin → Users** to mark them verified, **or**
- Verify everyone at once from a shell:

```bash
python manage.py shell -c "from apps.accounts.models import User; User.objects.update(is_email_verified=True)"
```

> New accounts created through the app's Register page also need verification. In
> development the verification link is printed to the **backend terminal** (console email
> backend).

---

## Environment variables

All backend config lives in the root `.env` (loaded by `python-dotenv`).

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SECRET_KEY` | Recommended | insecure dev key | Django secret key |
| `DEBUG` | Recommended | `False` | Set `True` for local dev |
| `DB_NAME` | ✅ | — | PostgreSQL database name |
| `DB_USER` | ✅ | — | Database user |
| `DB_PASSWORD` | ✅ | — | Database password |
| `DB_HOST` | — | `localhost` | Database host |
| `DB_PORT` | — | `5432` | Database port |
| `FRONTEND_URL` | — | `http://localhost:5173` | Used in email links |
| `EMAIL_BACKEND` | — | console (in DEBUG) | Set for real SMTP email |
| `EMAIL_HOST_USER` | — | — | SMTP username (real email) |
| `EMAIL_HOST_PASSWORD` | — | — | SMTP app password (real email) |
| `DEFAULT_FROM_EMAIL` | — | `noreply@pawtrack.com` | From-address on emails |

**Frontend (optional):** the API URL defaults to `http://127.0.0.1:8000/api/v1`. To point
the app at a different backend, create `frontend/.env` with:

```env
VITE_API_BASE=http://your-backend-host:8000/api/v1
```

---

## Background jobs (optional)

The app uses Celery for scheduled work (vaccination/appointment reminders, closing expired
donation campaigns, the lost-&-found matching engine, etc.). You only need this if you want
those jobs to actually run on a schedule — the core app works without it in `DEBUG` mode.

To enable it:

1. Start **Redis** (default broker `redis://localhost:6379/0`).
2. In `.env`, set `DEBUG=False` (so tasks are dispatched to the worker instead of running
   inline). Remember this also switches email to real SMTP.
3. Run the worker and scheduler, each in its own terminal (with the venv active):

```bash
# Worker
celery -A backend worker -l info
# On Windows, add: --pool=solo

# Scheduler (Celery Beat)
celery -A backend beat -l info
```

---

## Common commands

```bash
# Backend (venv active, from project root)
python manage.py makemigrations      # create new migrations after model changes
python manage.py migrate             # apply migrations
python manage.py createsuperuser     # create an admin account
python manage.py check               # sanity-check the project
python manage.py runserver           # start the API

# Frontend (from frontend/)
npm run dev       # start the dev server
npm run build     # production build
npm run preview   # preview the production build
npm run lint      # run ESLint
```

---

## Troubleshooting

- **`pip install` fails building `psycopg2`** (common on macOS/Linux): make sure PostgreSQL
  is installed and `pg_config` is on your `PATH`, then retry. On Windows a prebuilt wheel is
  used automatically.
- **`django.db.utils.OperationalError` / can't connect to database**: confirm PostgreSQL is
  running, the database exists, and the `DB_*` values in `.env` are correct.
- **Login says the email isn't verified**: log in as the Super Admin (exempt), or run the
  verify-everyone shell command in the Test accounts section.
- **Frontend loads but every request fails / CORS errors**: make sure the API is running on
  port 8000 and you're opening the app at `http://localhost:5173` (both origins are
  pre-allowed).
- **Port already in use**: run the API on another port with
  `python manage.py runserver 8001` (then set `VITE_API_BASE` accordingly), or start Vite on
  another port with `npm run dev -- --port 5174`.
