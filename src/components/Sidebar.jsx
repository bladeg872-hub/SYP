import { NavLink } from 'react-router-dom'
import { canAccess } from '../utils/auth'
import { useLanguage } from '../context/LanguageContext'
import financioLogo from '../assets/financio-logo.svg'

const navItems = [
  { path: '/dashboard/sales', labelKey: 'navSales', short: 'SA' },
  { path: '/dashboard/purchases', labelKey: 'navPurchases', short: 'PU' },
  { path: '/dashboard/expenses', labelKey: 'navExpenses', short: 'EX' },
  { path: '/dashboard/reports', labelKey: 'navReports', short: 'RP' },
  { path: '/dashboard/analytics', labelKey: 'navAnalytics', short: 'AN' },
  { path: '/dashboard/settings', labelKey: 'navSettings', short: 'SE' },
]

function Sidebar({ collapsed, mobileOpen, onClose, onToggleCollapse, userRole }) {
  const { t } = useLanguage()
  const visibleItems = navItems.filter((item) => canAccess(userRole, item.path))
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex bg-slate-900 text-white transition-transform duration-200 ${collapsed ? 'md:w-20' : 'md:w-64'} w-64 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
    >
      <div className="flex w-full flex-col">
        <div className="flex h-16 items-center justify-between border-b border-slate-700 px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-700 p-1 shadow-md shadow-blue-900/30">
              <img src={financioLogo} alt="FinAncio logo" className="h-full w-full" />
            </div>
            {!collapsed ? <span className="font-semibold tracking-tight text-slate-100">FinAncio</span> : null}
          </div>
          <button
            type="button"
            className="text-xs text-slate-200 md:hidden"
            onClick={onClose}
          >
            {t('commonClose')}
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {visibleItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center rounded-xl px-3 py-2 text-sm transition-colors ${isActive ? 'bg-blue-600 text-white shadow-sm shadow-blue-900/30' : 'text-slate-100 hover:bg-slate-800'}`
              }
            >
              <span className="inline-block min-w-7 text-xs font-semibold">{item.short}</span>
              {!collapsed ? <span>{t(item.labelKey)}</span> : null}
            </NavLink>
          ))}
        </nav>

        <div className="hidden border-t border-slate-700 p-3 md:block">
          <button
            type="button"
            className="w-full rounded-xl border border-slate-600 px-3 py-2 text-left text-sm text-slate-100 hover:bg-slate-800"
            onClick={onToggleCollapse}
          >
            {collapsed ? t('commonExpandSidebar') : t('commonCollapseSidebar')}
          </button>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
