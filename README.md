# FinAncio

**Simple financial UI for institutions in Nepal**

A full-stack application for managing sales, expenses, and purchases with tax reporting, built with React, Django, and SQLite/MySQL.

## Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- MySQL 8.0 (optional, SQLite default)

### Installation

1. **Backend Setup**
```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```

2. **Frontend Setup**
```bash
npm install
npm run dev
```

3. **Access Application**
- Frontend: http://localhost:5173
- Backend API: http://127.0.0.1:8000/api/

## Test Credentials

```
Username: admin
Password: admin123
Role: admin
```

## Project Structure

```
FinAncio/
├── backend/                 # Django REST API
│   ├── config/             # Django settings
│   ├── users/              # Auth & user management
│   ├── manage.py
│   └── requirements.txt
├── src/                    # React frontend
│   ├── components/         # Reusable UI components
│   ├── pages/              # Page components
│   ├── layouts/            # Layout wrapper components
│   ├── context/            # React context (language, auth)
│   ├── config/             # API & app configuration
│   ├── utils/              # Utility functions
│   └── App.jsx
├── scripts/                # Database & utility scripts
│   ├── reset.sql
│   ├── reset_mysql_admin.ps1
│   └── reset_mysql_password.bat
├── docs/                   # Documentation
│   └── SETUP.md           # Detailed setup guide
├── public/                 # Static assets
├── package.json
├── vite.config.js
├── tailwind.config.js
├── eslint.config.js
└── README.md              # This file
```

## Features

- 🔐 JWT-based authentication
- 📊 Sales, expenses, and purchases tracking
- 📈 Financial analytics and reports
- 💰 Tax calculation (TDS, VAT)
- 📝 Bill uploads
- 👥 Role-based access (admin, manager, accountant)
- 📱 Responsive UI
- 🌐 Multi-language support (English, Nepali)

## Development

### Environment Variables

**Backend** (`backend/config/settings.py`):
```powershell
$env:DB_NAME="syp_db"
$env:DB_USER="root"
$env:DB_PASSWORD="password"
$env:DB_HOST="127.0.0.1"
$env:DB_PORT="3306"
```

**Frontend** (`.env` or via Vite config):
```
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

### Available Scripts

**Frontend:**
```bash
npm run dev       # Start dev server
npm run build     # Build for production
npm run preview   # Preview production build
```

**Backend:**
```bash
python manage.py runserver          # Start dev server
python manage.py migrate            # Apply migrations
python manage.py shell              # Interactive shell
```

## Database

- **Default**: SQLite (`backend/db.sqlite3`)
- **Production**: MySQL 8.0

### Reset Database

See `/scripts` folder for database reset utilities.

## Documentation

- [Setup Guide](./docs/SETUP.md) - Detailed installation instructions
- [Backend README](./backend/README.md) - Backend API documentation

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS
- **Backend**: Django 4.x, Django REST Framework, Simple JWT
- **Database**: SQLite / MySQL 8.0
- **Tools**: ESLint, Prettier (via Tailwind)

## License

Proprietary - FinAncio

## Support

For issues or questions, refer to the documentation in `/docs` folder.
