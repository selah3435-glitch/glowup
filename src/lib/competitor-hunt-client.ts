import type { CompetitorHuntResult } from './competitor-scout'
import { huntCompetitorsServer } from './competitor-hunt-server'

const ENDPOINTS = ['/api/agents/competitor-hunt', '/.netlify/functions/competitor-hunt'] as const

export async function huntLocalCompetitors(
  city: string,
  ownName: string,
): Promise<CompetitorHuntResult> {
  try {
    const server = await huntCompetitorsServer({ data: { city, ownName } })
    if (server.competitors || server.error) return server
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
      return JSON.parse(text) as CompetitorHuntResult
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
