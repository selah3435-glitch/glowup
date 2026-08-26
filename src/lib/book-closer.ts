/** Intent band from the words they wrote — not a fake close rate. */

import type { SalonContext } from './demo-salon'

export type IntentBand = 'hot' | 'warm' | 'nurture'

export type IntentRead = {
  band: IntentBand
  reasons: string[]
}

const HOT = /\b(book|booking|appoint(ment)?|available|availability|this week|tomorrow|today|can i come|come in|slot|reserve)\b/i
const WARM = /\b(how much|price|pricing|interested|thinking|do you (do|take|offer)|new client|consultation|when can)\b/i
const NURTURE = /\b(love|obsessed|goals|stunning|pretty|need this|want this)\b/i

export const BOOK_CLOSER_SAMPLES = [
  'Do you have anything Saturday for a gloss?',
  'How much is balayage? I might book this month.',
  'This color is everything',
]

export function readBookingIntent(incoming: string): IntentRead {
  const text = incoming.trim()
  const reasons: string[] = []
  if (HOT.test(text)) reasons.push('They asked about booking or a time.')
  if (WARM.test(text)) reasons.push('They asked about price, fit, or becoming a client.')
  if (NURTURE.test(text)) reasons.push('They complimented the work but did not ask to book.')

  let band: IntentBand = 'nurture'
  if (HOT.test(text)) band = 'hot'
  else if (WARM.test(text)) band = 'warm'
  else if (NURTURE.test(text)) band = 'nurture'
  else if (text) reasons.push('No clear book/price language. Treat as a soft close.')

  if (!text) {
    return { band: 'nurture', reasons: ['Empty message.'] }
  }
  if (!reasons.length) reasons.push('No clear book/price language. Treat as a soft close.')
  return { band, reasons }
}

export function formatBookCloserExtra(input: {
  incoming: string
  salon: SalonContext
  intent: IntentRead
}): string {
  return [
    'INCOMING (close this, do not invent a different ask):',
    input.incoming.trim() || '(empty)',
    `Intent band from their words: ${input.intent.band}`,
    ...input.intent.reasons.map((r) => `- ${r}`),
    'FACTS:',
    `Salon: ${input.salon.name} · ${input.salon.city}`,
    `Tone: ${input.salon.brandTone}`,
    `Services: ${input.salon.services.join(', ')}`,
    input.salon.externalBookingUrl
      ? `Booking URL (use this, do not invent another): ${input.salon.externalBookingUrl}`
      : 'No booking URL on file. Do not invent one. Ask them to DM a day that works.',
    'Do not invent an open chair or a price.',
  ].join('\n')
}

export function intentLabel(band: IntentBand): string {
  if (band === 'hot') return 'Hot — they asked to book or named a time'
  if (band === 'warm') return 'Warm — price or fit question'
  return 'Nurture — compliment / soft interest'
}
