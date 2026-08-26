import type { SalonContext } from './demo-salon'
import { snapshotBookGaps } from './book-gaps'

export function formatCompetitorExtra(salon: SalonContext, notes: string): string {
  const snap = snapshotBookGaps()
  return [
    'OUR FLOOR:',
    `${salon.name} · ${salon.city} · ${salon.brandTone}`,
    `Menu: ${salon.services.join(', ')}`,
    `${snap.openChairs.length} open chairs tomorrow. ${snap.rebookDue.length} color returns due.`,
    'COMPETITOR NOTES FROM OWNER (only source for the rival):',
    notes.trim() || '(none — do not invent a competitor)',
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
