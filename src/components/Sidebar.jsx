import { NavLink } from 'react-router-dom'
import { canAccess } from '../utils/auth'

const navItems = [
  { path: '/dashboard', label: 'Dashboard', short: 'DB' },
  { path: '/dashboard/sales', label: 'Sales', short: 'SA' },
  { path: '/dashboard/purchases', label: 'Purchases', short: 'PU' },
  { path: '/dashboard/expenses', label: 'Expenses', short: 'EX' },
  { path: '/dashboard/reports', label: 'Reports', short: 'RP' },
  { path: '/dashboard/analytics', label: 'Analytics', short: 'AN' },
  { path: '/dashboard/audit', label: 'Audit', short: 'AU' },
  { path: '/dashboard/settings', label: 'Settings', short: 'SE' },
]

function Sidebar({ collapsed, mobileOpen, onClose, onToggleCollapse, userRole }) {
  const visibleItems = navItems.filter((item) => canAccess(userRole, item.path))
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex bg-gray-700 text-white transition-transform duration-200 ${collapsed ? 'md:w-20' : 'md:w-64'} w-64 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
    >
      <div className="flex w-full flex-col">
        <div className="flex h-16 items-center justify-between border-b border-gray-600 px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 font-bold">
              F
            </div>
            {!collapsed ? <span className="font-semibold">FinAncio</span> : null}
          </div>
          <button
            type="button"
            className="text-xs text-gray-200 md:hidden"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {visibleItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/dashboard'}
              className={({ isActive }) =>
                `flex items-center rounded-lg px-3 py-2 text-sm transition-colors ${isActive ? 'bg-blue-600 text-white' : 'text-gray-100 hover:bg-gray-600'}`
              }
            >
              <span className="inline-block min-w-7 text-xs font-semibold">{item.short}</span>
              {!collapsed ? <span>{item.label}</span> : null}
            </NavLink>
          ))}
        </nav>

        <div className="hidden border-t border-gray-600 p-3 md:block">
          <button
            type="button"
            className="w-full rounded-lg border border-gray-500 px-3 py-2 text-left text-sm text-gray-100 hover:bg-gray-600"
            onClick={onToggleCollapse}
          >
            {collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          </button>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
