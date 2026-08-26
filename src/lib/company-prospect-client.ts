import { searchCompanyProspects } from './company-prospect-server'
import type { ProspectSearchResult } from './company-prospect'

export async function findSalonProspects(city: string): Promise<ProspectSearchResult> {
  try {
    return await searchCompanyProspects({ data: { city } })
  } catch {
    /* HTTP fallback */
  }
  try {
    const controller = new AbortController()
    const timer = window.setTimeout(() => controller.abort(), 45000)
    let text = ''
    let html = false
    for (const path of ['/api/agents/company-prospect', '/.netlify/functions/company-prospect']) {
      const res = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city }),
        signal: controller.signal,
      })
      text = await res.text()
      html = /<!DOCTYPE|<html/i.test(text.slice(0, 80))
      if (!html) break
    }
    window.clearTimeout(timer)
    if (html) {
      return {
        city,
        query: '',
        provider: 'none',
        items: [],
        socialItems: [],
        error: 'Prospect search not deployed',
      }
    }
    return JSON.parse(text) as ProspectSearchResult
  } catch (e) {
    return {
      city,
      query: '',
      provider: 'none',
      items: [],
      socialItems: [],
      error: e instanceof Error ? e.message : 'search failed',
    }
  }
}
