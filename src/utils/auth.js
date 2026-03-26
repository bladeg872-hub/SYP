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

export function isTokenExpired(token) {
  const payload = parseJwtPayload(token)
  if (!payload?.exp) return true

  // JWT exp is in seconds since epoch.
  return payload.exp * 1000 <= Date.now()
}

export function hasValidAccessToken() {
  const token = getAccessToken()
  if (!token) return false
  return !isTokenExpired(token)
}

export function isAuthenticated() {
  return hasValidAccessToken()
}

export function getUserRole() {
  const token = getAccessToken()
  if (!token || isTokenExpired(token)) return null
  const payload = parseJwtPayload(token)
  return payload?.role || null
}

export const ROLE_PERMISSIONS = {
  admin: [
    '/dashboard',
    '/dashboard/settings',
    '/dashboard/audit',
  ],
  manager: [
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
  if (role === 'admin') {
    return '/dashboard/settings'
  }
  return '/dashboard'
}
