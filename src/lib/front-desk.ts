/** Front Desk reply context — only facts on file. */

import type { SalonContext } from './demo-salon'
import { loadOpsSettings } from './ops-settings'

export type FrontDeskIntent =
  | 'custom'
  | 'hours'
  | 'book'
  | 'prices'
  | 'parking'
  | 'new_client'
  | 'thanks'

export const FRONT_DESK_INTENTS: { id: FrontDeskIntent; label: string; sample: string }[] = [
  { id: 'hours', label: 'Hours', sample: 'What time do you close on Saturday?' },
  { id: 'book', label: 'How to book', sample: 'How do I book a gloss?' },
  { id: 'prices', label: 'Prices', sample: 'How much is balayage?' },
  { id: 'parking', label: 'Parking', sample: 'Is there parking?' },
  { id: 'new_client', label: 'New client', sample: 'Do you take new clients?' },
  { id: 'thanks', label: 'Compliment', sample: 'Obsessed with this color!!' },
  { id: 'custom', label: 'Paste a comment', sample: '' },
]

export function formatFrontDeskExtra(input: {
  incoming: string
  intent: FrontDeskIntent
  salon: SalonContext
}): string {
  const ops = loadOpsSettings()
  const lines = [
    'INCOMING (reply to this, do not invent a different question):',
    input.incoming.trim() || '(empty)',
    `Intent hint: ${input.intent}`,
    'FACTS ON FILE:',
    `Salon: ${input.salon.name}`,
    `City: ${input.salon.city}`,
    `Tone: ${input.salon.brandTone}`,
    `Services: ${input.salon.services.join(', ')}`,
    input.salon.externalBookingUrl
      ? `Booking URL: ${input.salon.externalBookingUrl}`
      : 'No booking URL on file. Do not invent one.',
    ops.studioName ? `Studio label: ${ops.studioName}` : '',
    'Hours, prices, and parking are NOT on file unless the incoming message already states them. Do not invent them.',
  ]
  return lines.filter(Boolean).join('\n')
}
