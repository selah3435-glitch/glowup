/**
 * Competitor Scout hunt — nearby Google Places, then public $ from competitor sites.
 * Facts only. Empty prices = “not published,” never invented.
 */
import { searchNearbySalons } from './company-prospect'
import {
  extractPublicPrices,
  isOwnSalon,
  type CompetitorFact,
  type CompetitorHuntResult,
} from './competitor-scout'
import { fetchPublicHtml, hasScrapingBee } from './scrapingbee-leads'

const PRICE_PATHS = ['/', '/services', '/pricing', '/menu', '/book', '/prices']

function originOf(url: string): string {
  try {
    return new URL(url).origin
  } catch {
    return ''
  }
}

function joinPath(origin: string, path: string): string {
  if (path === '/') return origin + '/'
  return origin.replace(/\/$/, '') + path
}

async function pricesFromSite(pageUrl: string): Promise<{ prices: string[]; note: string }> {
  const origin = originOf(pageUrl)
  if (!origin) return { prices: [], note: 'No website on Google.' }
  if (!hasScrapingBee()) return { prices: [], note: 'No public prices pulled (ScrapingBee not set).' }

  const seen = new Set<string>()
  const collected: string[] = []
  const start = pageUrl.startsWith('http') ? pageUrl : origin
  const urls = [start, ...PRICE_PATHS.map((p) => joinPath(origin, p))].filter((u) => {
    if (seen.has(u)) return false
    seen.add(u)
    return true
  })

  for (const u of urls.slice(0, 3)) {
    const html = await fetchPublicHtml(u).catch(() => '')
    if (!html) continue
    for (const p of extractPublicPrices(html)) {
      if (!collected.includes(p)) collected.push(p)
    }
    if (collected.length >= 6) break
  }

  if (collected.length) return { prices: collected.slice(0, 8), note: 'Public $ found on their site.' }
  return { prices: [], note: 'Site fetched — no public $ listed (call-for-pricing / booking-only).' }
}

export async function runCompetitorHunt(input: {
  city: string
  ownName: string
}): Promise<CompetitorHuntResult> {
  const city = input.city.trim()
  const ownName = input.ownName.trim()
  if (city.length < 2) {
    return { city, competitors: [], note: '', error: 'Set a city in Brand / onboarding first.' }
  }

  let listings
  try {
    listings = await searchNearbySalons(city)
  } catch (e) {
    return {
      city,
      competitors: [],
      note: '',
      error: e instanceof Error ? e.message : 'Google hunt failed',
    }
  }

  const nearby = listings.filter((h) => !isOwnSalon(h.title, ownName)).slice(0, 6)

  if (!nearby.length) {
    return {
      city,
      competitors: [],
      note: listings.length
        ? 'Google only returned this salon. Try a more specific city.'
        : 'No nearby salon listings. Check SERPER_API_KEY on the server.',
    }
  }

  const competitors: CompetitorFact[] = []
  for (const hit of nearby) {
    const pulled = await pricesFromSite(hit.url)
    competitors.push({
      title: hit.title,
      address: hit.address,
      ratingSnippet: hit.snippet,
      url: hit.url,
      phone: hit.phone,
      prices: pulled.prices,
      priceNote: pulled.note,
    })
  }

  const withPrices = competitors.filter((c) => c.prices.length).length
  return {
    city,
    competitors,
    note: `Pulled ${competitors.length} nearby floors from Google. Public $ on ${withPrices}. Missing $ is “not listed,” not a guess.`,
  }
}
