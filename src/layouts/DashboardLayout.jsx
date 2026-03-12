import { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import { AUTH_ENDPOINTS } from '../config/api'
import { clearTokens, getAccessToken, getUserRole } from '../utils/auth'

function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [institutionName, setInstitutionName] = useState('Institution')
  const userRole = getUserRole()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    clearTokens()
    navigate('/login', { replace: true })
  }

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const token = getAccessToken()
    if (!token) {
      return
    }

    const fetchProfile = async () => {
      try {
        const response = await fetch(AUTH_ENDPOINTS.me, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          return
        }

        const data = await response.json()
        setInstitutionName(data?.institution_name || 'Institution')
      } catch {
        setInstitutionName('Institution')
      }
    }

    fetchProfile()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        onToggleCollapse={() => setCollapsed((prev) => !prev)}
        userRole={userRole}
      />

      <div className={`transition-all duration-200 ${collapsed ? 'md:ml-20' : 'md:ml-64'}`}>
        <Navbar
          institutionName={institutionName}
          userRole={userRole}
          onLogout={handleLogout}
          onMenuClick={() => setMobileOpen(true)}
        />

        <main className="p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
