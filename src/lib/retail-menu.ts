/** Real menu rows for Retail & Services and Shorts. */

import type { SalonContext } from './demo-salon'
import type { ChairMoment } from './chair-content'

export function listMenuItems(salon: SalonContext): string[] {
  return salon.services.filter(Boolean)
}

export function formatRetailExtra(input: {
  service: string
  salon: SalonContext
  bookingUrl?: string
}): string {
  return [
    'MENU ITEM (do not invent another):',
    input.service,
    `Salon: ${input.salon.name} · ${input.salon.city}`,
    `Tone: ${input.salon.brandTone}`,
    `Full menu: ${input.salon.services.join(', ')}`,
    input.bookingUrl
      ? `Booking URL: ${input.bookingUrl}`
      : 'No booking URL on file. Do not invent one.',
    'No price on file. Do not invent a dollar amount.',
  ].join('\n')
}

export function formatShortsExtra(input: {
  service: string
  chair?: ChairMoment
  salon: SalonContext
}): string {
  const lines = [
    'SHORTS SUBJECT (stay on this service):',
    input.service,
    `Salon: ${input.salon.name} · ${input.salon.brandTone}`,
  ]
  if (input.chair) {
    lines.push(`Chair row: ${input.chair.stylist} at ${input.chair.time}. Do not name the guest.`)
    if (input.chair.notes) lines.push(`Notes: ${input.chair.notes}`)
  } else {
    lines.push('No chair row. Write from the menu item only.')
  }
  return lines.join('\n')
}
