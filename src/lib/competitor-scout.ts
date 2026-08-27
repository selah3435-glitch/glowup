import type { SalonContext } from './demo-salon'
import { snapshotBookGaps } from './book-gaps'
import { extractPublicPrices, isOwnSalon } from './competitor-prices'

export { extractPublicPrices, isOwnSalon }

export type CompetitorFact = {
  title: string
  address?: string
  ratingSnippet: string
  url: string
  phone?: string
  prices: string[]
  priceNote: string
}

export type CompetitorHuntResult = {
  city: string
  competitors: CompetitorFact[]
  note: string
  error?: string
}

export function formatCompetitorExtra(
  salon: SalonContext,
  notes: string,
  competitors: CompetitorFact[] = [],
): string {
  const snap = snapshotBookGaps()
  const pulled = competitors.length
    ? competitors
        .map((c) => {
          const prices = c.prices.length ? c.prices.join(' | ') : c.priceNote
          return [
            `- ${c.title}`,
            c.address ? `  address: ${c.address}` : '',
            c.ratingSnippet ? `  google: ${c.ratingSnippet}` : '',
            c.phone ? `  phone: ${c.phone}` : '',
            c.url ? `  url: ${c.url}` : '',
            `  prices: ${prices}`,
          ]
            .filter(Boolean)
            .join('\n')
        })
        .join('\n')
    : '(no Google listings pulled — do not invent a competitor)'
  return [
    'OUR FLOOR:',
    `${salon.name} · ${salon.city} · ${salon.brandTone}`,
    `Menu: ${salon.services.join(', ')}`,
    `${snap.openChairs.length} open chairs tomorrow. ${snap.rebookDue.length} color returns due.`,
    'PULLED LOCAL COMPETITORS (Google Places + public $ on their site). Do not invent missing prices or occupancy:',
    pulled,
    'OWNER NOTES (optional extra, not a substitute for pulled facts):',
    notes.trim() || '(none)',
  ].join('\n')
}

export function formatSeoExtra(salon: SalonContext): string {
  return [
    'LOCAL SEO FACTS (do not invent rankings):',
    `Name: ${salon.name}`,
    `City: ${salon.city || '(missing)'}`,
    `Services: ${salon.services.join(', ')}`,
    salon.externalBookingUrl ? `Booking: ${salon.externalBookingUrl}` : 'No booking URL.',
    salon.googleReviewUrl ? `Reviews: ${salon.googleReviewUrl}` : 'No Google review URL.',
  ].join('\n')
}
