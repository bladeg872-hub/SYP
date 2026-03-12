import { Link } from 'react-router-dom'
import PrimaryButton from './PrimaryButton'

function Navbar({ institutionName, userRole, onLogout, onMenuClick }) {
  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white">
      <div className="flex items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="rounded-lg border border-gray-300 px-2 py-1 text-sm text-gray-700 md:hidden"
            onClick={onMenuClick}
          >
            Menu
          </button>
          <div>
            <p className="text-xs text-gray-500">Institution</p>
            <h2 className="text-sm font-semibold text-gray-900 sm:text-base">{institutionName}</h2>
          </div>
          {userRole && (
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium capitalize text-blue-700">
              {userRole}
            </span>
          )}
        </div>
        <Link to="/login">
          <PrimaryButton variant="outline" onClick={onLogout}>
            Logout
          </PrimaryButton>
        </Link>
      </div>
    </header>
  )
}

export default Navbar
