# FinAncio - Setup Guide

## Prerequisites
- Python 3.9+
- Node.js 18+
- MySQL 8.0 (optional, SQLite default for dev)

## Frontend Setup

```bash
# Install dependencies
npm install

# Start dev server (runs on http://localhost:5173 or next available port)
npm run dev

# Build for production
npm run build

# Lint code
npx eslint src/
```

## Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create test user (optional)
python manage.py shell
```

## Database

### SQLite (Default)
Automatically configured in `backend/config/settings.py`

### MySQL
Set environment variables before running:
```powershell
$env:DB_NAME="syp_db"
$env:DB_USER="root"
$env:DB_PASSWORD="your_password"
$env:DB_HOST="127.0.0.1"
$env:DB_PORT="3306"
```

Then run migrations:
```bash
python manage.py migrate
```

## Reset Database

Use scripts in `/scripts` folder:
- `reset.sql` - SQL commands
- `reset_mysql_admin.ps1` - PowerShell admin reset script
- `reset_mysql_password.bat` - Batch admin reset script

## Test Credentials

- **Username**: admin
- **Password**: admin123
- **Role**: admin
- **Status**: verified

## Running Both Servers

### Terminal 1: Backend
```bash
cd backend
python manage.py runserver 127.0.0.1:8000
```

### Terminal 2: Frontend
```bash
npm run dev
```

Visit `http://localhost:5173` (or displayed port) and log in with test credentials.
