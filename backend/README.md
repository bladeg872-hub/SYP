# Django Authentication Backend

This backend provides JWT-based authentication APIs for your frontend.

## Database

By default, the backend uses SQLite for local development (no extra setup required).

If you want to use MySQL, set `DB_ENGINE=mysql` and configure:

```powershell
$env:DB_NAME="syp_db"
$env:DB_USER="root"
$env:DB_PASSWORD="your_password"
$env:DB_HOST="127.0.0.1"
$env:DB_PORT="3306"
$env:DB_ENGINE="mysql"
```

## Endpoints

- `POST /api/auth/register/` → Create user account
- `POST /api/auth/login/` → Get `access` + `refresh` JWT tokens
- `POST /api/auth/refresh/` → Refresh access token
- `GET /api/auth/me/` → Get authenticated user profile
- `PATCH /api/auth/me/` → Update authenticated user profile

## Quick Start (Windows PowerShell)

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Server runs on `http://127.0.0.1:8000/`.

## Frontend Integration

- Login endpoint returns:
  - `access` token
  - `refresh` token
- Send access token as:
  - `Authorization: Bearer <access_token>`

CORS is pre-configured for Vite dev server origins:

- `http://localhost:5173`
- `http://127.0.0.1:5173`
