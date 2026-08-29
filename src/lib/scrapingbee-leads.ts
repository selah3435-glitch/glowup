/**
 * ScrapingBee Google SERP + HTML fallback.
 * Page HTML: Firecrawl first (see firecrawl-leads), then ScrapingBee.
 * Public results only. No invented emails.
 */
import { scrapeWithFirecrawl } from './firecrawl-leads'

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
export type BeeRawHit = {
  title: string
  url: string
  snippet: string
  city: string
  phone?: string
  address?: string
  source: 'google_places' | 'google_web'
}

function cleanKey(raw?: string): string {
  return (raw || '').trim().replace(/^['"]|['"]$/g, '')
}

function getEnv(name: string): string {
  const fromProc = cleanKey(process.env[name])
  if (fromProc) return fromProc
  try {
    const raw = readFileSync(resolve(process.cwd(), '.env'), 'utf8')
    const line = raw.split(/\r?\n/).find((l) => l.startsWith(`${name}=`))
    if (line) return cleanKey(line.slice(name.length + 1))
  } catch {
    /* ignore */
  }
  return ''
}

export function hasScrapingBee(): boolean {
  return Boolean(getEnv('SCRAPINGBEE_API_KEY'))
}

/** Fetch public HTML. Firecrawl first, ScrapingBee fallback. Empty if both fail. */
export async function fetchPublicHtml(pageUrl: string): Promise<string> {
  if (!/^https?:\/\//i.test(pageUrl)) return ''
  if (/google\.com\/search|maps\.google/i.test(pageUrl)) return ''
  const fromFirecrawl = await scrapeWithFirecrawl(pageUrl).catch(() => '')
  if (fromFirecrawl) return fromFirecrawl
  const key = getEnv('SCRAPINGBEE_API_KEY')
  if (!key) return ''
  const url = new URL('https://app.scrapingbee.com/api/v1/')
  url.searchParams.set('api_key', key)
  url.searchParams.set('url', pageUrl)
  url.searchParams.set('render_js', 'false')
  url.searchParams.set('premium_proxy', 'false')
  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(14000) })
  if (!res.ok) {
    console.warn(`[scrapingbee] html ${res.status} ${pageUrl}`)
    return ''
  }
  return res.text()
}

type Organic = {
  title?: string
  url?: string
  description?: string
  displayed_url?: string
}

type LocalHit = {
  title?: string
  review?: number
  review_count?: number
  address?: string
  phone?: string
  link?: string
  website?: string
}

async function googleSearch(q: string): Promise<{ organic: Organic[]; local: LocalHit[] }> {
  const key = getEnv('SCRAPINGBEE_API_KEY')
  if (!key) return { organic: [], local: [] }
  const url = new URL('https://app.scrapingbee.com/api/v1/store/google')
  url.searchParams.set('api_key', key)
  url.searchParams.set('search', q)
  url.searchParams.set('language', 'en')
  url.searchParams.set('nb_results', '20')
  const res = await fetch(url.toString())
  if (!res.ok) {
    console.warn(`[scrapingbee] google ${res.status}`)
    return { organic: [], local: [] }
  }
  const data = (await res.json()) as {
    organic_results?: Organic[]
    local_results?: LocalHit[]
  }
  return {
    organic: Array.isArray(data.organic_results) ? data.organic_results : [],
    local: Array.isArray(data.local_results) ? data.local_results : [],
  }
}

export async function huntWithScrapingBee(city: string): Promise<{ items: BeeRawHit[]; note: string }> {
  if (!hasScrapingBee()) {
    return { items: [], note: 'SCRAPINGBEE_API_KEY not set.' }
  }
  const queries = [
    `hair salon ${city}`,
    `beauty salon ${city}`,
    `booth rental salon ${city}`,
    `salon hiring stylists ${city}`,
  ]
  const seen = new Set<string>()
  const items: BeeRawHit[] = []
  for (const q of queries) {
    try {
      const { organic, local } = await googleSearch(q)
      for (const p of local) {
        const url = p.website || p.link || ''
        const key = (p.phone || url || p.title || '').toLowerCase()
        if (!key || seen.has(key)) continue
        seen.add(key)
        items.push({
          title: p.title || url,
          url: url || `https://www.google.com/search?q=${encodeURIComponent(`${p.title || ''} ${city}`)}`,
          snippet: [p.address, p.review ? `${p.review}★ (${p.review_count || 0})` : ''].filter(Boolean).join(' · '),
          city,
          phone: p.phone,
          address: p.address,
          source: 'google_places',
        })
      }
      for (const o of organic) {
        const url = String(o.url || '')
        if (!url.startsWith('http') || seen.has(url)) continue
        seen.add(url)
        items.push({
          title: String(o.title || url),
          url,
          snippet: String(o.description || o.displayed_url || ''),
          city,
          source: 'google_web',
        })
      }
    } catch (e) {
      console.warn('[scrapingbee] query failed', e instanceof Error ? e.message : e)
    }
  }
  return {
    items,
    note: `ScrapingBee: ${items.length} public Google hits.`,
  }
}
