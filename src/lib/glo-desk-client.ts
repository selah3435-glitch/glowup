/** Client for /api/glo/desk — public Glo front desk */

export type GloDeskDay = {
  dateISO: string
  dateLabel: string
  weekday: string
  slots: string[]
}

export type GloDeskPublic = {
  ok: boolean
  salonKey: string
  studioName: string
  city: string
  hours: string
  services: string[]
  days: GloDeskDay[]
  error?: string
}

export type GloDeskBookResult = {
  ok: boolean
  error?: string
  confirmation_code?: string
  slots?: string[]
  appointment?: { id: string; service: string; dateISO: string; dateLabel: string; time: string }
}

const ENDPOINTS = ['/api/glo/desk', '/.netlify/functions/glo-desk'] as const

function looksLikeHtml(text: string) {
  return /<!DOCTYPE|<html[\s>]/i.test(text.slice(0, 200))
}

async function deskFetch(init: { method: 'GET'; key: string } | { method: 'POST'; body: object }) {
  let last = { status: 0, text: 'No endpoint reached' }
  for (const endpoint of ENDPOINTS) {
    try {
      const url = init.method === 'GET' ? `${endpoint}?key=${encodeURIComponent(init.key)}` : endpoint
      const res = await fetch(url, {
        method: init.method,
        headers: init.method === 'POST' ? { 'Content-Type': 'application/json' } : undefined,
        body: init.method === 'POST' ? JSON.stringify(init.body) : undefined,
        cache: 'no-store',
      })
      const text = await res.text()
      last = { status: res.status, text }
      if (looksLikeHtml(text) && endpoint === ENDPOINTS[0]) continue
      return last
    } catch (e) {
      last = { status: 0, text: e instanceof Error ? e.message : 'network' }
    }
  }
  return last
}

export async function fetchGloDesk(salonKey: string): Promise<GloDeskPublic> {
  const { status, text } = await deskFetch({ method: 'GET', key: salonKey })
  try {
    const data = JSON.parse(text) as GloDeskPublic
    if (status >= 200 && status < 300) return { ...data, ok: true, salonKey }
    return {
      ok: false,
      salonKey,
      studioName: '',
      city: '',
      hours: '',
      services: [],
      days: [],
      error: data.error || `HTTP ${status}`,
    }
  } catch {
    return {
      ok: false,
      salonKey,
      studioName: '',
      city: '',
      hours: '',
      services: [],
      days: [],
      error: text.slice(0, 160) || `HTTP ${status}`,
    }
  }
}

export async function gloDeskAction(body: Record<string, unknown>): Promise<GloDeskBookResult> {
  const { status, text } = await deskFetch({ method: 'POST', body })
  try {
    const data = JSON.parse(text) as GloDeskBookResult
    if (status >= 200 && status < 300) return { ...data, ok: data.ok !== false }
    return { ok: false, error: data.error || `HTTP ${status}` }
  } catch {
    return { ok: false, error: text.slice(0, 160) || `HTTP ${status}` }
  }
}
