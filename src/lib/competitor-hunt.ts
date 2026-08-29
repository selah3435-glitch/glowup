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
import { hasFirecrawl } from './firecrawl-leads'
import { fetchPublicHtml, hasScrapingBee } from './scrapingbee-leads'

function originOf(url: string): string {
  try {
    return new URL(url).origin
  } catch {
    return ''
  }
}

async function pricesFromSite(pageUrl: string): Promise<{ prices: string[]; note: string }> {
  const origin = originOf(pageUrl)
  if (!origin) return { prices: [], note: 'No website on Google.' }
  if (!hasFirecrawl() && !hasScrapingBee()) {
    return { prices: [], note: 'No public prices pulled (set FIRECRAWL_API_KEY or SCRAPINGBEE_API_KEY).' }
  }

  const collected: string[] = []
  const start = pageUrl.startsWith('http') ? pageUrl : `${origin}/`
  const html = await fetchPublicHtml(start).catch(() => '')
  if (!html) return { prices: [], note: 'Could not fetch their site.' }
  for (const p of extractPublicPrices(html)) {
    if (!collected.includes(p)) collected.push(p)
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

  let listings: Awaited<ReturnType<typeof searchNearbySalons>> = []
  try {
    listings = (await searchNearbySalons(city)) || []
  } catch (e) {
    return {
      city,
      competitors: [],
      note: '',
      error: e instanceof Error ? e.message : 'Google hunt failed',
    }
  }

  const nearby = listings.filter((h) => !isOwnSalon(h.title, ownName)).slice(0, 4)

  if (!nearby.length) {
    return {
      city,
      competitors: [],
      note: listings.length
        ? 'Google only returned this salon. Try a more specific city.'
        : 'No nearby salon listings. Check SERPER_API_KEY on the server.',
    }
  }

  const competitors: CompetitorFact[] = await Promise.all(
    nearby.map(async (hit) => {
      const pulled = await pricesFromSite(hit.url || '')
      return {
        title: hit.title,
        address: hit.address,
        ratingSnippet: hit.snippet,
        url: hit.url,
        phone: hit.phone,
        prices: pulled.prices ?? [],
        priceNote: pulled.note,
      }
    }),
  )

  const withPrices = competitors.filter((c) => (c.prices?.length ?? 0) > 0).length
  return {
    city,
    competitors,
    note: `Pulled ${competitors.length} nearby floors from Google. Public $ on ${withPrices}. Missing $ is “not listed,” not a guess.`,
  }
}
