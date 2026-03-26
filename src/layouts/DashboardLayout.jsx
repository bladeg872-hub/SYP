import { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import { AUTH_ENDPOINTS } from '../config/api'
import { useLanguage } from '../context/LanguageContext'
import { clearTokens, getAccessToken, getUserRole } from '../utils/auth'

function DashboardLayout() {
  const { t } = useLanguage()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [institutionName, setInstitutionName] = useState(t('commonInstitution'))
  const [notice, setNotice] = useState('')
  const userRole = getUserRole()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    clearTokens()
    navigate('/login', {
      replace: true,
      state: { successMessage: t('authSuccessLogout') },
    })
  }

  /* eslint-disable-next-line react-hooks/set-state-in-effect */
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  /* eslint-disable-next-line react-hooks/set-state-in-effect */
  useEffect(() => {
    if (location.state?.successMessage) {
      setNotice(location.state.successMessage)
      navigate(location.pathname, { replace: true, state: null })
    }
  }, [location.state?.successMessage, location.pathname, navigate])

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
          if (response.status === 401) {
            clearTokens()
            navigate('/login', {
              replace: true,
              state: { successMessage: t('commonSessionExpired') },
            })
          }
          return
        }

        const data = await response.json()
        setInstitutionName(data?.institution_name || t('commonInstitution'))
      } catch {
        setInstitutionName(t('commonInstitution'))
      }
    }

    fetchProfile()
  }, [navigate, t])

  return (
    <div className="min-h-screen bg-gray-50">
      {mobileOpen && (
        <button
          type="button"
          aria-label={t('commonClose')}
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
          {notice ? (
            <div className="mb-4 rounded-lg border border-green-100 bg-green-50 px-3 py-2 text-sm text-green-700">
              {notice}
            </div>
          ) : null}
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
