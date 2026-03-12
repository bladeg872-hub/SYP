const ACCESS_TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'

export function saveTokens({ access, refresh }) {
  if (access) {
    localStorage.setItem(ACCESS_TOKEN_KEY, access)
  }
  if (refresh) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh)
  }
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

export function isAuthenticated() {
  return Boolean(getAccessToken())
}

function parseJwtPayload(token) {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch {
    return null
  }
}

export function getUserRole() {
  const token = getAccessToken()
  if (!token) return null
  const payload = parseJwtPayload(token)
  return payload?.role || null
}

export const ROLE_PERMISSIONS = {
  admin: [
    '/dashboard',
    '/dashboard/sales',
    '/dashboard/purchases',
    '/dashboard/expenses',
    '/dashboard/reports',
    '/dashboard/analytics',
    '/dashboard/audit',
    '/dashboard/settings',
  ],
  accountant: [
    '/dashboard',
    '/dashboard/sales',
    '/dashboard/purchases',
    '/dashboard/expenses',
    '/dashboard/reports',
  ],
  auditor: [
    '/dashboard',
    '/dashboard/reports',
    '/dashboard/analytics',
    '/dashboard/audit',
  ],
}

export function canAccess(role, path) {
  const allowed = ROLE_PERMISSIONS[role]
  if (!allowed) return false
  return allowed.includes(path)
}

export function getDefaultRoute(role) {
  return '/dashboard'
}
