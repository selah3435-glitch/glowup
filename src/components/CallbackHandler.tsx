import { useEffect, type ReactNode } from 'react'
import { handleAuthCallback } from '@netlify/identity'
import { isOnboarded } from '../lib/pilot-session'

const authHashPattern = /^#(confirmation_token|recovery_token|invite_token|email_change_token|access_token)=/

export function CallbackHandler({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (!authHashPattern.test(window.location.hash)) return
    void handleAuthCallback()
      .then(() => {
        // After email confirm / OAuth, land in the right place
        const dest = isOnboarded() ? '/dashboard' : '/onboarding'
        if (!window.location.pathname.startsWith(dest)) {
          window.location.replace(dest)
        }
      })
      .catch(() => {
        // Still send them somewhere useful
        window.location.replace(isOnboarded() ? '/dashboard' : '/onboarding')
      })
  }, [])

  return children
}
