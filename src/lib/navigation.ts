/** Safe internal redirect — only allows app paths starting with / */
export function safeRedirect(path: string | null | undefined, fallback = '/'): string {
  if (!path || typeof path !== 'string') return fallback
  if (!path.startsWith('/') || path.startsWith('//')) return fallback
  return path
}

export function loginUrl(redirect = '/'): string {
  return `/login?redirect=${encodeURIComponent(safeRedirect(redirect))}`
}

export function registerUserUrl(next = '/'): string {
  return `/register-user?next=${encodeURIComponent(safeRedirect(next))}`
}
