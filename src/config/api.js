const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api'

export const API_BASE_URL = configuredApiBaseUrl.replace(/\/$/, '')

export const AUTH_ENDPOINTS = {
  register: `${API_BASE_URL}/auth/register/`,
  login: `${API_BASE_URL}/auth/login/`,
  me: `${API_BASE_URL}/auth/me/`,
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
}

export const ANALYTICS_ENDPOINTS = {
  summary: `${API_BASE_URL}/auth/analytics/`,
}

export const AUDIT_ENDPOINTS = {
  summary: `${API_BASE_URL}/auth/audit/`,
}
