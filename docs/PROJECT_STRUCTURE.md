# Project Structure

## Root Directory (Clean)

```
FinAncio/
├── .git/                    # Git repository
├── .gitignore              # Git ignore rules
├── .venv/                  # Python virtual environment
├── backend/                # Django REST API backend
├── dist/                   # Production build output
├── docs/                   # Project documentation
├── node_modules/           # Node.js dependencies
├── public/                 # Static public assets
├── scripts/                # Utility & database scripts
├── src/                    # React frontend source code
├── eslint.config.js        # ESLint configuration
├── index.html              # HTML entry point
├── package.json            # Node.js dependencies
├── package-lock.json       # Locked Node.js versions
├── postcss.config.js       # PostCSS configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── vite.config.js          # Vite build configuration
└── README.md               # Project documentation (updated)
```

## Backend Structure

```
backend/
├── config/                 # Django project configuration
│   ├── __init__.py
│   ├── asgi.py            # ASGI application
│   ├── settings.py        # Django settings
│   ├── urls.py            # Project URL routes
│   └── wsgi.py            # WSGI application
├── users/                 # User & authentication app
│   ├── admin.py           # Django admin configuration
│   ├── apps.py            # App configuration
│   ├── migrations/        # Database migrations
│   ├── models.py          # Database models
│   ├── permissions.py     # Custom permissions
│   ├── serializers.py     # DRF serializers
│   ├── urls.py            # App URL routes
│   ├── views.py           # API views
│   └── __init__.py
├── db.sqlite3             # SQLite database
├── manage.py              # Django management script
├── populate_db.py         # Database seeding script
├── requirements.txt       # Python dependencies
└── README.md              # Backend documentation
```

## Frontend Structure

```
src/
├── components/            # Reusable UI components
│   ├── DataTable.jsx
│   ├── DatePickerInput.jsx
│   ├── FileUpload.jsx
│   ├── FormInput.jsx
│   ├── Navbar.jsx
│   ├── PageHeader.jsx
│   ├── PrimaryButton.jsx
│   ├── SelectInput.jsx
│   ├── Sidebar.jsx
│   └── SummaryCard.jsx
├── config/                # Configuration files
│   ├── api.js             # API endpoints configuration
│   └── irdTaxRules.js     # Tax calculation rules
├── context/               # React context
│   └── LanguageContext.jsx # Language/i18n state
├── layouts/               # Page layout components
│   ├── AuthLayout.jsx     # Auth page layout
│   └── DashboardLayout.jsx # Dashboard layout
├── pages/                 # Page components
│   ├── auth/              # Authentication pages
│   │   ├── LoginPage.jsx
│   │   └── RegisterPage.jsx
│   └── dashboard/         # Dashboard pages
│       ├── AnalyticsPage.jsx
│       ├── AuditPage.jsx
│       ├── DashboardHomePage.jsx
│       ├── ExpensesPage.jsx
│       ├── PurchasesPage.jsx
│       ├── ReportsPage.jsx
│       ├── SalesPage.jsx
│       └── SettingsPage.jsx
├── utils/                 # Utility functions
│   └── auth.js            # Authentication utilities
├── assets/                # Static assets
├── App.jsx                # Root component
├── index.css              # Global styles
└── main.jsx               # Application entry point
```

## Scripts Structure

```
scripts/
├── reset.sql                  # SQL database reset commands
├── reset_mysql_admin.ps1      # PowerShell MySQL admin reset
└── reset_mysql_password.bat   # Batch MySQL password reset
```

## Documentation Structure

```
docs/
└── SETUP.md               # Detailed setup & installation guide
```

## Deleted Files (Cleanup)

The following unnecessary files have been removed:
- ❌ `README.md` (Vite template boilerplate) - Replaced with proper project README
- ❌ `nul` (Windows temporary file)
- ❌ `reset.sql` (moved to `/scripts`)
- ❌ `reset_mysql_admin.ps1` (moved to `/scripts`)
- ❌ `reset_mysql_password.bat` (moved to `/scripts`)
- ❌ `src/components/## GitHub Copilot Chat.litcoffee` (Chat history file)
- ❌ `src/pages/dashboard/## Chat Customization Diagnostics.md` (Diagnostics file)

## Kept vs Deleted

### ✅ Kept (Mandatory)
- `package.json` - Node.js project manifest
- `vite.config.js` - Frontend build configuration
- `eslint.config.js` - Linting configuration
- `tailwind.config.js` - CSS framework configuration
- `postcss.config.js` - PostCSS configuration
- `index.html` - HTML template
- `.gitignore` - Git exclusions
- All source code (`/src`, `/backend`)

### ❌ Deleted (Unnecessary)
- Boilerplate README
- Windows temporary files
- Chat history files
- Duplicate database reset scripts (moved to centralized location)

## New Additions

### 📁 New Folders
- `/scripts` - Centralized database utilities
- `/docs` - Project documentation

### 📄 New Files
- `README.md` (updated) - Comprehensive project documentation
- `docs/SETUP.md` - Detailed setup guide
- `scripts/reset.sql` - Database reset commands
- `scripts/reset_mysql_admin.ps1` - Admin reset script
- `scripts/reset_mysql_password.bat` - Batch reset script

## Quick Navigation

- **Setup Instructions**: See `docs/SETUP.md`
- **Backend API Docs**: See `backend/README.md`
- **Running the Project**: See main `README.md`
- **Database Utilities**: See `scripts/` folder
