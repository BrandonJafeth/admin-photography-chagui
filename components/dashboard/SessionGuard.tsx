'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from '@/services/auth.service'
import { shouldExpireSession, markSessionActive } from '@/lib/session-remember'

/**
 * Enforces "remember me": if the user opted out and this is a fresh
 * browser session (tab/browser was closed since login), sign out and
 * bounce back to /login instead of trusting Supabase's persistent cookie.
 */
export default function SessionGuard() {
  const router = useRouter()

  useEffect(() => {
    if (shouldExpireSession()) {
      signOut().finally(() => {
        router.replace('/login')
        router.refresh()
      })
      return
    }

    markSessionActive()
  }, [router])

  return null
}
