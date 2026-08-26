/** Weekly angles from menu + season + live book — no invented trend rankings. */

import { loadSalonContext, type SalonContext } from './demo-salon'
import { snapshotBookGaps, type BookGapSnapshot } from './book-gaps'

export type TrendCard = {
  id: string
  title: string
  why: string
  service: string
  seasonLabel: string
}

function monthAngle(month: number): { label: string; hook: string } {
  const map: Record<number, { label: string; hook: string }> = {
    0: { label: 'New year reset', hook: 'fresh-year cut and gloss' },
    1: { label: 'Late winter', hook: 'soft dimension before spring' },
    2: { label: 'Early spring', hook: 'lighter color as days get longer' },
    3: { label: 'Spring events', hook: 'event-ready blowout and gloss' },
    4: { label: 'Late spring', hook: 'sun-ready cut and hydration' },
    5: { label: 'Early summer', hook: 'gloss that holds in heat' },
    6: { label: 'Midsummer', hook: 'tone-down brass, keep the shine' },
    7: { label: 'Late summer', hook: 'end-of-summer gloss before fall' },
    8: { label: 'Back to a routine', hook: 'shape and color before fall calendars fill' },
    9: { label: 'Early fall', hook: 'deeper tone, same softness' },
    10: { label: 'Holiday lead-in', hook: 'quiet glam that photographs well' },
    11: { label: 'Year-end', hook: 'party-ready finish, calm chair time' },
  }
  return map[month] || map[7]
}

function pickService(services: string[], prefer: RegExp, fallbackIndex = 0): string {
  return services.find((s) => prefer.test(s)) || services[fallbackIndex] || 'your next visit'
}

export function buildTrendCards(
  now = new Date(),
  salon: SalonContext = loadSalonContext(),
  snap: BookGapSnapshot = snapshotBookGaps(),
): TrendCard[] {
  const season = monthAngle(now.getMonth())
  const cards: TrendCard[] = []

  const color = pickService(salon.services, /color|balayage|gloss/i)
  cards.push({
    id: 'season',
    title: `${season.label} · ${color}`,
    why: `Calendar: ${season.hook}. From your menu in ${salon.city || 'your city'} — not a viral ranking.`,
    service: color,
    seasonLabel: season.label,
  })

  const cut = pickService(salon.services, /cut|style|haircut/i, 0)
  if (cut !== color) {
    cards.push({
      id: 'menu-cut',
      title: `Menu · ${cut}`,
      why: `On your real menu. A calm process post — no invented demand spike.`,
      service: cut,
      seasonLabel: season.label,
    })
  } else if (salon.services[1]) {
    cards.push({
      id: 'menu-second',
      title: `Menu · ${salon.services[1]}`,
      why: `Second item on your real menu. Spotlight it without a fake trend score.`,
      service: salon.services[1],
      seasonLabel: season.label,
    })
  }

  if (snap.openChairs.length > 0) {
    const sample = snap.openChairs.slice(0, 3).map((c) => `${c.stylist} ${c.time}`).join(', ')
    cards.push({
      id: 'slow',
      title: `Open chairs · ${snap.tomorrowLabel}`,
      why: `${snap.openChairs.length} open chairs tomorrow. Name only these if you mention time: ${sample}.`,
      service: color,
      seasonLabel: season.label,
    })
  } else if (snap.rebookDue.length > 0) {
    cards.push({
      id: 'rebook-social',
      title: 'Color return window',
      why: `${snap.rebookDue.length} guests in the 8–14 week color window. Social teaser only — do not name them.`,
      service: color,
      seasonLabel: season.label,
    })
  }

  return cards.slice(0, 3)
}

export function formatTrendExtra(card: TrendCard, snap: BookGapSnapshot): string {
  return [
    'TREND ANGLE (do not invent rankings or impressions):',
    card.title,
    card.why,
    `Lead service: ${card.service}`,
    `Season label: ${card.seasonLabel}`,
    `${snap.openChairs.length} open chairs tomorrow (${snap.tomorrowLabel}).`,
    'Social must not name a guest.',
  ].join('\n')
}
