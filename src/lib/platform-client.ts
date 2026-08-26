/** Client → platform signup / funnel tracking */

export type PlatformStage =
  | 'signed_up'
  | 'onboarding_started'
  | 'onboarding_complete'
  | 'active'

export type PlatformSignup = {
  id: string
  email: string
  name: string
  identityUserId?: string
  stage: PlatformStage
  createdAt: string
  updatedAt: string
  meta?: Record<string, unknown>
}

export async function trackPlatformEvent(input: {
  email: string
  name?: string
  identityUserId?: string
  stage: PlatformStage
  meta?: Record<string, unknown>
}): Promise<{ ok: boolean; item?: PlatformSignup; error?: string }> {
  try {
    const res = await fetch('/api/platform', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    const data = (await res.json()) as { ok?: boolean; item?: PlatformSignup; error?: string }
    if (!res.ok) return { ok: false, error: data.error || `HTTP ${res.status}` }
    return { ok: true, item: data.item }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'network' }
  }
}

export async function listPlatformSignups(adminToken?: string): Promise<{
  ok: boolean
  count?: number
  items?: PlatformSignup[]
  stages?: Record<string, number>
  error?: string
}> {
  try {
    const headers: Record<string, string> = {}
    if (adminToken) headers.Authorization = `Bearer ${adminToken}`
    const q = adminToken ? `?key=${encodeURIComponent(adminToken)}` : ''
    const res = await fetch(`/api/platform${q}`, { headers })
    const data = await res.json()
    if (!res.ok) return { ok: false, error: data.error || `HTTP ${res.status}` }
    return { ok: true, ...data }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'network' }
  }
}
