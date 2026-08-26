/** Seamless pilot session — survives even if Identity is slow or email confirm lags */

export type PilotSession = {
  email: string
  name: string
  createdAt: string
  onboardedAt?: string
  mode: 'identity' | 'guest'
}

const KEY = 'glowup_pilot_session_v1'
const ONBOARD_KEY = 'glowup_onboarded_v1'

function canUse() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function savePilotSession(patch: Partial<PilotSession> & { email: string }) {
  if (!canUse()) return null
  const prev = loadPilotSession()
  const next: PilotSession = {
    email: patch.email.trim().toLowerCase(),
    name: (patch.name ?? prev?.name ?? '').trim(),
    createdAt: prev?.createdAt || new Date().toISOString(),
    onboardedAt: patch.onboardedAt ?? prev?.onboardedAt,
    mode: patch.mode || prev?.mode || 'guest',
  }
  window.localStorage.setItem(KEY, JSON.stringify(next))
  try {
    window.localStorage.setItem('glowup_last_email', next.email)
  } catch {
    /* ignore */
  }
  return next
}

export function loadPilotSession(): PilotSession | null {
  if (!canUse()) return null
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return null
    return JSON.parse(raw) as PilotSession
  } catch {
    return null
  }
}

export function markOnboarded() {
  if (!canUse()) return
  window.localStorage.setItem(ONBOARD_KEY, '1')
  const s = loadPilotSession()
  if (s) {
    savePilotSession({ ...s, email: s.email, onboardedAt: new Date().toISOString() })
  }
}

export function isOnboarded(): boolean {
  if (!canUse()) return false
  if (window.localStorage.getItem(ONBOARD_KEY) === '1') return true
  const s = loadPilotSession()
  return Boolean(s?.onboardedAt)
}

/** Where to send a user after auth */
export function postAuthPath(): '/onboarding' | '/dashboard' {
  return isOnboarded() ? '/dashboard' : '/onboarding'
}
