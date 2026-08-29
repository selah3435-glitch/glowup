/**
 * Firecrawl — first-choice public web scrape/search for company hunt + competitor prices.
 * Use with Apify (IG/TikTok) and Zernio (IG comments). Public pages only.
 * Never invent emails, occupancy, or prices.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

export type FirecrawlHit = {
  title: string
  url: string
  snippet: string
  city: string
  source: 'google_web'
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

export function hasFirecrawl(): boolean {
  return Boolean(getEnv('FIRECRAWL_API_KEY'))
}

function firecrawlKey(): string {
  return getEnv('FIRECRAWL_API_KEY')
}

type ScrapeBody = {
  success?: boolean
  data?: { html?: string; markdown?: string; rawHtml?: string }
}

/** Public page body. Empty if no key or the page fails. */
export async function scrapeWithFirecrawl(pageUrl: string): Promise<string> {
  const key = firecrawlKey()
  if (!key) return ''
  if (!/^https?:\/\//i.test(pageUrl)) return ''
  if (/google\.com\/search|maps\.google/i.test(pageUrl)) return ''
  try {
    const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: pageUrl,
        formats: ['html', 'markdown'],
        onlyMainContent: true,
        timeout: 15000,
      }),
      signal: AbortSignal.timeout(16000),
    })
    if (!res.ok) {
      console.warn(`[firecrawl] scrape ${res.status} ${pageUrl}`)
      return ''
    }
    const data = (await res.json()) as ScrapeBody
    const html = String(data.data?.html || data.data?.rawHtml || '').trim()
    const md = String(data.data?.markdown || '').trim()
    return html || md
  } catch (e) {
    console.warn('[firecrawl] scrape failed', e instanceof Error ? e.message : e)
    return ''
  }
}

type SearchItem = { title?: string; url?: string; description?: string; markdown?: string }

export async function huntWithFirecrawl(city: string): Promise<{ items: FirecrawlHit[]; note: string }> {
  const key = firecrawlKey()
  if (!key) return { items: [], note: 'FIRECRAWL_API_KEY not set.' }
  const queries = [`hair salon ${city}`, `booth rental salon ${city}`]
  const seen = new Set<string>()
  const items: FirecrawlHit[] = []
  for (const q of queries) {
    try {
      const res = await fetch('https://api.firecrawl.dev/v1/search', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: q, limit: 8 }),
        signal: AbortSignal.timeout(14000),
      })
      if (!res.ok) {
        console.warn(`[firecrawl] search ${res.status}`)
        continue
      }
      const data = (await res.json()) as { data?: SearchItem[] }
      for (const row of Array.isArray(data.data) ? data.data : []) {
        const url = String(row.url || '')
        if (!url.startsWith('http') || seen.has(url)) continue
        if (/yelp\.com|maps\.google|facebook\.com\/directory/i.test(url)) continue
        seen.add(url)
        items.push({
          title: String(row.title || url),
          url,
          snippet: String(row.description || '').slice(0, 240),
          city,
          source: 'google_web',
        })
      }
    } catch (e) {
      console.warn('[firecrawl] search failed', e instanceof Error ? e.message : e)
    }
  }
  return {
    items,
    note: `Firecrawl: ${items.length} public web hits.`,
  }
}
