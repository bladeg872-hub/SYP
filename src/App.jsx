import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import AuthLayout from './layouts/AuthLayout'
import DashboardLayout from './layouts/DashboardLayout'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import AnalyticsPage from './pages/dashboard/AnalyticsPage'
import AuditPage from './pages/dashboard/AuditPage'
import DashboardHomePage from './pages/dashboard/DashboardHomePage'
import ExpensesPage from './pages/dashboard/ExpensesPage'
import PurchasesPage from './pages/dashboard/PurchasesPage'
import ReportsPage from './pages/dashboard/ReportsPage'
import SalesPage from './pages/dashboard/SalesPage'
import SettingsPage from './pages/dashboard/SettingsPage'
import { canAccess, getUserRole, isAuthenticated } from './utils/auth'

function ProtectedRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }

  return children
}

function RoleRoute({ children }) {
  const location = useLocation()
  const role = getUserRole()

  if (!role || !canAccess(role, location.pathname)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

function PublicOnlyRoute({ children }) {
  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicOnlyRoute><AuthLayout /></PublicOnlyRoute>}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<DashboardHomePage />} />
          <Route path="sales" element={<RoleRoute><SalesPage /></RoleRoute>} />
          <Route path="purchases" element={<RoleRoute><PurchasesPage /></RoleRoute>} />
          <Route path="expenses" element={<RoleRoute><ExpensesPage /></RoleRoute>} />
          <Route path="reports" element={<RoleRoute><ReportsPage /></RoleRoute>} />
          <Route path="analytics" element={<RoleRoute><AnalyticsPage /></RoleRoute>} />
          <Route path="audit" element={<RoleRoute><AuditPage /></RoleRoute>} />
          <Route path="settings" element={<RoleRoute><SettingsPage /></RoleRoute>} />
        </Route>

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
