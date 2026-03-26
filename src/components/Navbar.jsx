import { Link } from 'react-router-dom'
import PrimaryButton from './PrimaryButton'
import { LANGUAGE_OPTIONS, useLanguage } from '../context/LanguageContext'

function Navbar({ institutionName, userRole, onLogout, onMenuClick }) {
  const { language, setLanguage, t } = useLanguage()

  const roleLabel =
    userRole === 'admin'
      ? t('roleAdmin')
      : userRole === 'manager'
        ? t('roleBusinessOwner')
        : userRole === 'accountant'
          ? t('roleAccountant')
          : userRole === 'auditor'
            ? t('roleAuditor')
            : userRole

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="rounded-lg border border-slate-300 px-2 py-1 text-sm text-slate-700 md:hidden"
            onClick={onMenuClick}
          >
            {t('commonMenu')}
          </button>
          <div>
            <p className="text-xs text-slate-500">{t('commonInstitution')}</p>
            <h2 className="text-sm font-semibold tracking-tight text-slate-900 sm:text-base">{institutionName}</h2>
          </div>
          {userRole && (
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium capitalize text-blue-700 shadow-sm shadow-blue-200/70">
              {roleLabel}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="language-select" className="text-xs text-slate-500">
            {t('commonLanguage')}
          </label>
          <select
            id="language-select"
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700"
          >
            {LANGUAGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <Link to="/login">
            <PrimaryButton variant="outline" onClick={onLogout}>
              {t('commonLogout')}
            </PrimaryButton>
          </Link>
        </div>
      </div>
    </header>
  )
}

export default Navbar
