const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api'

export const API_BASE_URL = configuredApiBaseUrl.replace(/\/$/, '')

export const AUTH_ENDPOINTS = {
  register: `${API_BASE_URL}/auth/register/`,
  login: `${API_BASE_URL}/auth/login/`,
  me: `${API_BASE_URL}/auth/me/`,
  adminCreateUser: `${API_BASE_URL}/auth/admin/create-user/`,
  adminAccounts: `${API_BASE_URL}/auth/admin/accounts/`,
  adminTeamMembers: `${API_BASE_URL}/auth/admin/team-members/`,
  adminPendingUsers: `${API_BASE_URL}/auth/admin/pending-users/`,
  adminVerifyUser: `${API_BASE_URL}/auth/admin/verify-user/`,
  adminDeclineUser: `${API_BASE_URL}/auth/admin/decline-user/`,
  adminDeleteUser: `${API_BASE_URL}/auth/admin/delete-user/`,
}

export const SALES_ENDPOINTS = {
  listCreate: `${API_BASE_URL}/auth/sales/`,
}

export const PURCHASES_ENDPOINTS = {
  listCreate: `${API_BASE_URL}/auth/purchases/`,
}

export const EXPENSES_ENDPOINTS = {
  listCreate: `${API_BASE_URL}/auth/expenses/`,
}

export const DASHBOARD_ENDPOINTS = {
  summary: `${API_BASE_URL}/auth/dashboard/`,
}

export const REPORTS_ENDPOINTS = {
  summary: `${API_BASE_URL}/auth/reports/`,
  tdsCertificate: `${API_BASE_URL}/auth/reports/tds-certificate/`,
  challanSlip: `${API_BASE_URL}/auth/reports/challan-slip/`,
}

export const ANALYTICS_ENDPOINTS = {
  summary: `${API_BASE_URL}/auth/analytics/`,
}

export const AUDIT_ENDPOINTS = {
  summary: `${API_BASE_URL}/auth/audit/`,
}
