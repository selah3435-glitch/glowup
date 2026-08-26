import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { getUser, logout as netlifyLogout, onAuthChange, type User } from '@netlify/identity'

interface IdentityContextValue {
  user: User | null
  ready: boolean
  logout: () => Promise<void>
}

const IdentityContext = createContext<IdentityContextValue | null>(null)

export function IdentityProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    void getUser()
      .then((currentUser) => {
        if (cancelled) return
        setUser(currentUser ?? null)
        setReady(true)
      })
      .catch(() => {
        if (cancelled) return
        setUser(null)
        setReady(true)
      })
    let unsubscribe: (() => void) | undefined
    try {
      unsubscribe = onAuthChange((_event, currentUser) => {
        if (!cancelled) setUser(currentUser ?? null)
      })
    } catch {
      /* Identity unavailable offline / preview */
    }
    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [])

  return (
    <IdentityContext.Provider value={{ user, ready, logout: netlifyLogout }}>{children}</IdentityContext.Provider>
  )
}

export function useIdentity() {
  const context = useContext(IdentityContext)
  if (!context) throw new Error('useIdentity must be used within IdentityProvider')
  return context
}
