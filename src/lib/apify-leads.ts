/**
 * Apify Instagram/TikTok harvest for GlowUP company sales.
 * Public data only. Filter for salon operators — no invented emails, no auto-DM.
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { icpBand, scoreCompanyIcp } from './company-icp'
import type { DiscoveredSalon } from './company-prospect'

const GLOWUP_IG = 'glowup.beautysolutions'
const GLOWUP_TT = 'glowupbeautysolutions'

const ICP =
  /owner|founder|manager|salon|stylist|booth\s*rent|suite\s*rent|multi[- ]?location|chair rental|colorist|beauty business/i
const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
const PHONE_RE = /\+?1?[\s.-]?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/

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

async function runActor(actorId: string, input: Record<string, unknown>, timeout = 90): Promise<unknown[]> {
  const token = getEnv('APIFY_API_TOKEN')
  if (!token) return []
  const url = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${encodeURIComponent(token)}&timeout=${timeout}`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), (timeout + 15) * 1000)
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
      signal: controller.signal,
    })
    if (!res.ok) {
      console.warn(`[apify] ${actorId} ${res.status}`)
      return []
    }
    const data = await res.json()
    return Array.isArray(data) ? data : []
  } catch (e) {
    console.warn(`[apify] ${actorId} failed`, e instanceof Error ? e.message : e)
    return []
  } finally {
    clearTimeout(timer)
  }
}

type Loose = Record<string, unknown>

function str(v: unknown): string {
  return typeof v === 'string' ? v : v == null ? '' : String(v)
}

function handleFrom(row: Loose): string {
  return (
    str(row.ownerUsername) ||
    str(row.username) ||
    str(row.userName) ||
    str((row.owner as Loose | undefined)?.username) ||
    str(row.authorMeta && (row.authorMeta as Loose).name) ||
    ''
  ).replace(/^@/, '')
}

function rowToLead(row: Loose, city: string, sourceNote: string): DiscoveredSalon | null {
  const handle = handleFrom(row)
  const caption = str(row.caption) || str(row.text) || str(row.biography) || str(row.bio) || str(row.desc)
  const fullName = str(row.fullName) || str(row.ownerFullName) || handle
  const bio = str(row.biography) || str(row.bio) || caption
  const blob = `${handle} ${fullName} ${bio} ${caption}`
  if (!handle && !fullName) return null
  const emailMatch = blob.match(EMAIL_RE)
  const phoneMatch = blob.match(PHONE_RE)
  const icp = scoreCompanyIcp({ text: blob })
  const signals: string[] = [sourceNote, ...icp.signals]
  let points = 2 + icp.points
  if (ICP.test(blob)) {
    points += 4
    signals.push('Owner / stylist / booth / suite language')
  }
  if (emailMatch) {
    points += 3
    signals.push(`Public email: ${emailMatch[0]}`)
  }
  if (phoneMatch) {
    points += 2
    signals.push('Public phone in bio')
  }
  const band = icpBand(points)
  return {
    title: fullName || `@${handle}`,
    url: handle
      ? `https://www.instagram.com/${handle}/`
      : str(row.url) || str(row.webUrl) || '',
    snippet: [sourceNote, bio || caption].filter(Boolean).join(' · ').slice(0, 240),
    city,
    signals,
    band,
    points,
    phone: phoneMatch?.[0],
    source: 'instagram_comment',
    handle: handle || undefined,
  }
}

function cityHashtags(city: string): string[] {
  const slug = city.toLowerCase().replace(/[^a-z0-9]+/g, '')
  return [
    'salonowner',
    'salontok',
    'beautybusiness',
    'boothrenter',
    'suiterenter',
    'salonlife',
    ...(slug ? [`${slug}salon`, `${slug}hair`] : []),
  ]
}

export async function harvestApifySocial(city: string): Promise<{
  items: DiscoveredSalon[]
  note: string
}> {
  const token = getEnv('APIFY_API_TOKEN')
  if (!token) {
    return { items: [], note: 'APIFY_API_TOKEN missing — Instagram/TikTok hunt skipped.' }
  }

  const tags = cityHashtags(city).slice(0, 5)
  const [hashtagRows, igProfileRows, igComments, igFollowers, ttRows] = await Promise.all([
    runActor('apify~instagram-hashtag-scraper', {
      hashtags: tags,
      resultsLimit: 12,
    }),
    runActor('apify~instagram-scraper', {
      directUrls: [`https://www.instagram.com/${GLOWUP_IG}/`],
      resultsType: 'posts',
      resultsLimit: 8,
      addParentData: false,
    }),
    runActor('apify~instagram-comment-scraper', {
      directUrls: [`https://www.instagram.com/${GLOWUP_IG}/`],
      resultsLimit: 40,
    }),
    runActor(
      'apify~instagram-scraper',
      {
        directUrls: [`https://www.instagram.com/${GLOWUP_IG}/`],
        resultsType: 'details',
        resultsLimit: 200,
      },
      120,
    ),
    runActor('clockworks~tiktok-scraper', {
      profiles: [GLOWUP_TT],
      resultsPerPage: 8,
      shouldDownloadVideos: false,
      shouldDownloadCovers: false,
    }),
  ])

  const seen = new Set<string>()
  const items: DiscoveredSalon[] = []
  function add(row: Loose, note: string) {
    const hit = rowToLead(row, city, note)
    if (!hit) return
    const key = (hit.handle || hit.url || hit.title).toLowerCase()
    if (seen.has(key)) return
    seen.add(key)
    items.push(hit)
  }

  for (const row of hashtagRows) add(row as Loose, `Hashtag hunt · ${city}`)
  for (const row of igProfileRows) add(row as Loose, `GlowUP IG @${GLOWUP_IG}`)
  for (const row of igComments) add(row as Loose, `Comment on GlowUP IG`)
  for (const row of igFollowers) add(row as Loose, `Public GlowUP IG audience`)
  for (const row of ttRows) add(row as Loose, `GlowUP TikTok @${GLOWUP_TT}`)

  const operators = items.filter(
    (i) =>
      i.signals.some((s) => /operator|email|phone/i.test(s)) ||
      ICP.test(`${i.title} ${i.snippet} ${i.handle || ''}`),
  )
  const note = [
    `Apify: ${hashtagRows.length} hashtag, ${igComments.length} IG comments, ${igFollowers.length} IG profile/audience, ${ttRows.length} TikTok.`,
    `${operators.length} look like salon operators.`,
    'Public profiles only. Draft outreach here — Instagram will ban mass cold DMs.',
  ].join(' ')

  return { items: items.sort((a, b) => b.points - a.points), note }
}

export const GLOWUP_SOCIAL_HANDLES = { instagram: GLOWUP_IG, tiktok: GLOWUP_TT }
