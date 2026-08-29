/** Company Lead Scout: Google (Serper) + Firecrawl web + ScrapingBee fallback + Apify/Zernio social. */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { harvestApifySocial } from './apify-leads'
import { icpBand, scoreCompanyIcp } from './company-icp'
import { hasFirecrawl, huntWithFirecrawl, type FirecrawlHit } from './firecrawl-leads'
import { hasScrapingBee, huntWithScrapingBee } from './scrapingbee-leads'

export type ProspectSource = 'google_places' | 'google_web' | 'instagram_comment'

export type DiscoveredSalon = {
  title: string
  url: string
  snippet: string
  city: string
  signals: string[]
  band: 'hot' | 'warm' | 'nurture'
  points: number
  phone?: string
  address?: string
  source: ProspectSource
  handle?: string
}

export type ProspectSearchResult = {
  city: string
  query: string
  provider: string
  items: DiscoveredSalon[]
  socialItems: DiscoveredSalon[]
  error?: string
  socialNote?: string
}

const BOOKING = /vagaro|fresha|glossgenius|squareup|styleseat|booksy|zenoti|mindbody/i
const DIRECTORY = /yelp\.com|maps\.google|google\.com\/maps|yellowpages|bbb\.org/i
const SALONISH = /salon|hair|barber|beauty|colorist|balayage|stylist|suite|chair/i

export function rankDiscovery(hit: {
  title: string
  url: string
  snippet: string
  city: string
  phone?: string
  address?: string
  source: ProspectSource
  handle?: string
}): DiscoveredSalon {
  const blob = `${hit.title} ${hit.url} ${hit.snippet} ${hit.address || ''} ${hit.handle || ''}`
  const icp = scoreCompanyIcp({ text: blob })
  const signals: string[] = [...icp.signals]
  let points = 1 + icp.points
  if (hit.source === 'instagram_comment') {
    points += 3
    signals.push('Commented on your GlowUP post')
  }
  if (SALONISH.test(blob) || SALONISH.test(hit.handle || '')) {
    points += 2
    signals.push('Looks like a salon / beauty floor')
  }
  if (hit.phone) {
    points += 2
    signals.push('Google lists a phone')
  }
  if (BOOKING.test(blob)) {
    points += 1
    signals.push('Already pays for booking software — tech-ready')
  }
  if (DIRECTORY.test(hit.url)) signals.push('Directory listing')

  const band = icpBand(points)

  return {
    title: hit.title.trim() || hit.url,
    url: hit.url,
    snippet: (hit.snippet || '').trim(),
    city: hit.city,
    signals,
    band,
    points,
    phone: hit.phone,
    address: hit.address,
    source: hit.source,
    handle: hit.handle,
  }
}

function cleanKey(raw?: string): string {
  return (raw || '').trim().replace(/^['"]|['"]$/g, '')
}

/** Vite can strip static process.env.FOO. Read dynamically, then .env on disk. */
function getEnv(name: string): string {
  const fromProc = cleanKey(process.env[name])
  if (fromProc) return fromProc
  try {
    const raw = readFileSync(resolve(process.cwd(), '.env'), 'utf8')
    const line = raw.split(/\r?\n/).find((l) => l.startsWith(`${name}=`))
    if (line) return cleanKey(line.slice(name.length + 1))
  } catch {
    /* no .env in this runtime */
  }
  return ''
}

type Organic = { title?: string; link?: string; snippet?: string; url?: string }

type Place = {
  title?: string
  address?: string
  website?: string
  phoneNumber?: string
  category?: string
  rating?: number
  ratingCount?: number
}

function serperApiKey(): string {
  // Netlify UI was saved as SERPER_KEY; local/.env and health use SERPER_API_KEY.
  return getEnv('SERPER_API_KEY') || getEnv('SERPER_KEY')
}

async function serperPost(path: string, body: Record<string, unknown>): Promise<unknown | null> {
  const key = serperApiKey()
  if (!key) return null
  const res = await fetch(`https://google.serper.dev/${path}`, {
    method: 'POST',
    headers: { 'X-API-KEY': key, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (res.status === 401 || res.status === 403) {
    console.warn('[prospect] Serper rejected the key')
    return null
  }
  if (!res.ok) {
    console.warn(`[prospect] Serper ${path} ${res.status}`)
    return null
  }
  return res.json()
}

function placeToHit(p: Place, city: string): DiscoveredSalon | null {
  const url = p.website || ''
  if (!url && !p.title) return null
  const snippet = [p.category, p.address, p.rating ? `${p.rating}★ (${p.ratingCount || 0})` : '']
    .filter(Boolean)
    .join(' · ')
  return rankDiscovery({
    title: p.title || url,
    url: url || `https://www.google.com/search?q=${encodeURIComponent(p.title + ' ' + city)}`,
    snippet,
    city,
    phone: p.phoneNumber,
    address: p.address,
    source: 'google_places',
  })
}

/** Nearby Google Places only — used by Competitor Scout (no Apify / IG). */
export async function searchNearbySalons(city: string): Promise<DiscoveredSalon[]> {
  const queries = [`hair salon ${city}`, `nail salon ${city}`, `beauty salon ${city}`]
  const out: DiscoveredSalon[] = []
  const seen = new Set<string>()
  if (!serperApiKey()) return out
  for (const q of queries) {
    const data = (await serperPost('places', { q, page: 1 })) as { places?: Place[] } | null
    if (!data) continue
    for (const p of data.places || []) {
      const hit = placeToHit(p, city)
      if (!hit) continue
      const key = (hit.phone || hit.url || hit.title).toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      out.push(hit)
    }
  }
  return out
}

async function searchGooglePlaces(city: string): Promise<DiscoveredSalon[]> {
  const queries = [
    `hair salon ${city}`,
    `beauty salon ${city}`,
    `hair studio ${city}`,
    `color bar salon ${city}`,
    `booth rental salon ${city}`,
  ]
  const out: DiscoveredSalon[] = []
  const seen = new Set<string>()
  for (const q of queries) {
    for (const page of [1, 2]) {
      const data = (await serperPost('places', { q, page })) as { places?: Place[] } | null
      if (!data) continue
      for (const p of data.places || []) {
        const hit = placeToHit(p, city)
        if (!hit) continue
        const key = (hit.phone || hit.url || hit.title).toLowerCase()
        if (seen.has(key)) continue
        seen.add(key)
        out.push(hit)
      }
    }
  }
  return out
}

async function searchGoogleWeb(city: string): Promise<DiscoveredSalon[]> {
  const queries = [
    `hair salon ${city} -yelp`,
    `hair studio ${city} instagram`,
    `independent stylist suite ${city}`,
    `salon hiring stylists ${city}`,
    `"under new ownership" salon ${city}`,
    `"call to book" salon ${city}`,
  ]
  const out: DiscoveredSalon[] = []
  const seen = new Set<string>()
  for (const q of queries) {
    for (const page of [1, 2]) {
      const data = (await serperPost('search', { q, num: 20, page })) as { organic?: Organic[] } | null
      if (!data) continue
      for (const o of data.organic || []) {
        const url = String(o.link || o.url || '')
        if (!url.startsWith('http')) continue
        if (seen.has(url)) continue
        seen.add(url)
        out.push(
          rankDiscovery({
            title: String(o.title || url),
            url,
            snippet: String(o.snippet || ''),
            city,
            source: 'google_web',
          }),
        )
      }
    }
  }
  return out
}

type ZernioComment = {
  username?: string
  text?: string
  message?: string
  from?: { username?: string; name?: string }
}

async function harvestInstagramCommenters(): Promise<{ items: DiscoveredSalon[]; note: string }> {
  const key = getEnv('ZERNIO_API_KEY')
  if (!key) {
    return { items: [], note: 'ZERNIO_API_KEY missing — cannot read your IG comments.' }
  }
  const headers = { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }
  const accRes = await fetch('https://zernio.com/api/v1/accounts', { headers })
  if (!accRes.ok) {
    return { items: [], note: `Zernio accounts ${accRes.status}` }
  }
  const accJson = (await accRes.json()) as {
    data?: { _id?: string; id?: string; platform?: string; username?: string }[]
    accounts?: { _id?: string; id?: string; platform?: string; username?: string }[]
  }
  const list = accJson.accounts || accJson.data || []
  const ig = list.find((a) => /instagram/i.test(String(a.platform || '')))
  if (!ig) {
    return { items: [], note: 'No Instagram account connected in Zernio.' }
  }
  const accountId = String(ig._id || ig.id || '')
  const listRes = await fetch(
    `https://zernio.com/api/v1/inbox/comments?platform=instagram&account_id=${encodeURIComponent(accountId)}&limit=20`,
    { headers },
  )
  if (!listRes.ok) {
    return { items: [], note: `Zernio comment inbox ${listRes.status}` }
  }
  const listJson = (await listRes.json()) as {
    data?: { id?: string; commentCount?: number; permalink?: string }[]
  }
  const posts = listJson.data || []
  const items: DiscoveredSalon[] = []
  const seen = new Set<string>()
  let postsWithComments = 0
  for (const post of posts) {
    if (!post.id || !post.commentCount) continue
    postsWithComments++
    const cRes = await fetch(
      `https://zernio.com/api/v1/inbox/comments/${encodeURIComponent(post.id)}?account_id=${encodeURIComponent(accountId)}&limit=50`,
      { headers },
    )
    if (!cRes.ok) continue
    const cJson = (await cRes.json()) as { data?: ZernioComment[] }
    for (const c of cJson.data || []) {
      const handle = c.username || c.from?.username || c.from?.name || ''
      const text = c.text || c.message || ''
      if (!handle || seen.has(handle.toLowerCase())) continue
      seen.add(handle.toLowerCase())
      items.push(
        rankDiscovery({
          title: `@${handle}`,
          url: `https://www.instagram.com/${handle.replace(/^@/, '')}/`,
          snippet: text.slice(0, 180),
          city: '',
          source: 'instagram_comment',
          handle,
        }),
      )
    }
  }
  const note = postsWithComments
    ? `Pulled commenters from ${postsWithComments} of your IG posts. Follower lists are not available from Instagram/Zernio.`
    : 'Your connected IG posts have no comments yet. Follower lists are not available from Instagram/Zernio — we can only read people who comment on your posts.'
  return { items, note }
}

function mergeGoogle(...lists: DiscoveredSalon[][]): DiscoveredSalon[] {
  const seen = new Set<string>()
  const out: DiscoveredSalon[] = []
  for (const hit of lists.flat()) {
    const key = (hit.phone || hit.url || hit.title).toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(hit)
  }
  return out.sort((a, b) => b.points - a.points)
}

export async function runCompanyProspectSearch(city: string): Promise<ProspectSearchResult> {
  const trimmed = city.trim()
  if (trimmed.length < 2) {
    return {
      city: trimmed,
      query: '',
      provider: 'none',
      items: [],
      socialItems: [],
      error: 'Enter a city',
    }
  }
  const hasSerper = Boolean(serperApiKey())
  if (!hasSerper && !hasScrapingBee() && !hasFirecrawl()) {
    return {
      city: trimmed,
      query: '',
      provider: 'none',
      items: [],
      socialItems: [],
      error:
        'Server cannot see SERPER_API_KEY, FIRECRAWL_API_KEY, or SCRAPINGBEE_API_KEY. Restart npm run dev after saving .env.',
    }
  }

  const query = `hair salon ${trimmed}`
  try {
    const [places, web, bee, fire, zernio, apify] = await Promise.all([
      hasSerper ? searchGooglePlaces(trimmed).catch(() => [] as DiscoveredSalon[]) : Promise.resolve([] as DiscoveredSalon[]),
      hasSerper ? searchGoogleWeb(trimmed).catch(() => [] as DiscoveredSalon[]) : Promise.resolve([] as DiscoveredSalon[]),
      huntWithScrapingBee(trimmed).catch(() => ({
        items: [] as DiscoveredSalon[],
        note: 'ScrapingBee hunt failed',
      })),
      huntWithFirecrawl(trimmed).catch(() => ({
        items: [] as FirecrawlHit[],
        note: 'Firecrawl hunt failed',
      })),
      harvestInstagramCommenters().catch(() => ({
        items: [] as DiscoveredSalon[],
        note: 'Instagram comment harvest failed',
      })),
      Promise.race([
        harvestApifySocial(trimmed).catch(() => ({
          items: [] as DiscoveredSalon[],
          note: 'Apify harvest failed',
        })),
        new Promise<{ items: DiscoveredSalon[]; note: string }>((resolve) =>
          setTimeout(() => resolve({ items: [], note: 'Apify skipped (time budget).' }), 12000),
        ),
      ]),
    ])
    const items = mergeGoogle(
      places,
      web,
      bee.items.map((h) => rankDiscovery(h)),
      fire.items.map((h) => rankDiscovery(h)),
    )
    const socialItems = [...zernio.items, ...apify.items].sort((a, b) => b.points - a.points)
    return {
      city: trimmed,
      query,
      provider: `google ${items.length} + firecrawl/apify/ig ${socialItems.length}`,
      items,
      socialItems,
      socialNote: [fire.note, bee.note, apify.note, zernio.note].filter(Boolean).join(' '),
    }
  } catch (e) {
    return {
      city: trimmed,
      query,
      provider: 'serper',
      items: [],
      socialItems: [],
      error: e instanceof Error ? e.message : 'search failed',
    }
  }
}
