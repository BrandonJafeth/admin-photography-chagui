// lib/session-remember.ts
/**
 * Supabase's browser client (@supabase/ssr) always writes a persistent
 * ~400-day session cookie and ignores custom cookie maxAge, so "remember me"
 * can't be implemented via cookie expiry. Instead we track intent ourselves:
 * a flag in localStorage (survives browser restarts) plus a marker in
 * sessionStorage (cleared when the tab/browser closes). If the flag says
 * "don't remember" and the session-storage marker is gone, the browser was
 * restarted since login, so we sign the user out.
 */

const REMEMBER_KEY = 'gadea-remember-me'
const SESSION_MARK_KEY = 'gadea-session-active'

export function setRememberMe(remember: boolean): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(REMEMBER_KEY, remember ? 'true' : 'false')
  markSessionActive()
}

export function markSessionActive(): void {
  if (typeof window === 'undefined') return
  window.sessionStorage.setItem(SESSION_MARK_KEY, '1')
}

export function clearRememberState(): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(REMEMBER_KEY)
  window.sessionStorage.removeItem(SESSION_MARK_KEY)
}

/**
 * True when the user opted out of "remember me" and this is a fresh
 * browser session (the tab/browser was closed and reopened since login).
 */
export function shouldExpireSession(): boolean {
  if (typeof window === 'undefined') return false
  const remembered = window.localStorage.getItem(REMEMBER_KEY)
  const sessionActive = window.sessionStorage.getItem(SESSION_MARK_KEY)
  return remembered === 'false' && !sessionActive
}
