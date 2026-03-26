import { Outlet } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import financioLogo from '../assets/financio-logo.svg'

function AuthLayout() {
  const { t } = useLanguage()

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-8">
      <div className="pointer-events-none absolute -left-24 -top-32 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-20 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="relative w-full max-w-md rounded-2xl border border-white/20 bg-white/95 p-6 shadow-2xl backdrop-blur sm:p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-700 p-2 shadow-lg shadow-blue-200/70">
            <img src={financioLogo} alt="FinAncio logo" className="h-full w-full" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">FinAncio</h1>
          <p className="mt-1 text-sm text-slate-600">
            {t('authTagline')}
          </p>
        </div>
        <Outlet />
      </div>
    </div>
  )
}

export default AuthLayout
