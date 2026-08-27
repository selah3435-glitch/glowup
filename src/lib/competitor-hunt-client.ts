import type { CompetitorFact, CompetitorHuntResult } from './competitor-scout'
import { huntCompetitorsServer } from './competitor-hunt-server'

const ENDPOINTS = ['/api/agents/competitor-hunt', '/.netlify/functions/competitor-hunt'] as const

function asList(raw: unknown): CompetitorFact[] {
  if (!Array.isArray(raw)) return []
  return raw.map((row) => {
    const c = row as Partial<CompetitorFact>
    return {
      title: String(c.title || 'Salon'),
      address: c.address,
      ratingSnippet: String(c.ratingSnippet || ''),
      url: String(c.url || ''),
      phone: c.phone,
      prices: Array.isArray(c.prices) ? c.prices : [],
      priceNote: String(c.priceNote || ''),
    }
  })
}

function normalizeHunt(raw: unknown, city: string): CompetitorHuntResult {
  const data = (raw && typeof raw === 'object' ? raw : {}) as CompetitorHuntResult & {
    rivals?: CompetitorFact[]
  }
  return {
    city: data.city || city,
    competitors: asList(data.competitors ?? data.rivals),
    note: data.note || '',
    error: data.error,
  }
}

export async function huntLocalCompetitors(
  city: string,
  ownName: string,
): Promise<CompetitorHuntResult> {
  try {
    const server = await huntCompetitorsServer({ data: { city, ownName } })
    const normalized = normalizeHunt(server, city)
    if (normalized.competitors.length || normalized.error || normalized.note) {
      return normalized
    }
  } catch {
    /* HTTP fallback */
  }

  for (const path of ENDPOINTS) {
    try {
      const controller = new AbortController()
      const timer = window.setTimeout(() => controller.abort(), 90000)
      const res = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city,
          ownName,
          salonKey: (await import('./ops-settings')).loadOpsSettings().salonSyncKey,
        }),
        signal: controller.signal,
      })
      window.clearTimeout(timer)
      const text = await res.text()
      if (/<!DOCTYPE|<html[\s>]/i.test(text.slice(0, 200))) continue
      const parsed = JSON.parse(text) as unknown
      const normalized = normalizeHunt(parsed, city)
      if (!res.ok && !normalized.error) {
        normalized.error =
          (parsed as { error?: string })?.error || `Hunt failed (${res.status})`
      }
      return normalized
    } catch {
      /* next */
    }
  }
  return {
    city,
    competitors: [],
    note: '',
    error: 'Competitor hunt not deployed. Need Serper + ScrapingBee on the function.',
  }
}
