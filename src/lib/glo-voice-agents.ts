/** Glo voice roles — one face, five specialized skills (launch set). */

/** Public voice number for Glo (E.164) — attach this number to GLO_XAI_AGENT_ID in xAI Console */
export const GLO_PHONE_E164 = '+17372324091'
export const GLO_PHONE_DISPLAY = '+1 (737) 232-4091'
export const GLO_XAI_AGENT_ID = '00929ede-1eb1-4a74-9221-dd69617071f9'
/** Webhook path for phone bridge (PUBLIC_BASE_URL + this) */
export const GLO_VOICE_WEBHOOK_PATH = '/webhooks/xai/realtime'

export type GloVoiceRoleId =
  | 'glo_reception'
  | 'glo_sales'
  | 'glo_scheduler'
  | 'glo_support'
  | 'glo_followup'

export interface GloVoiceRole {
  id: GloVoiceRoleId
  displayName: string
  shortName: string
  tagline: string
  description: string
  channel: 'inbound' | 'outbound' | 'both'
  priority: number
}

/** Launch pack: 5 core voice agents under Glo */
export const GLO_VOICE_ROLES: GloVoiceRole[] = [
  {
    id: 'glo_reception',
    displayName: 'Glo Reception',
    shortName: 'Reception',
    tagline: 'Answer every call · route right',
    description:
      'Answers professionally, greets the caller, and routes to Sales, Scheduler, Support, or a human so no call is missed.',
    channel: 'inbound',
    priority: 1,
  },
  {
    id: 'glo_sales',
    displayName: 'Glo Sales',
    shortName: 'Sales',
    tagline: 'Qualify leads 24/7',
    description:
      'Asks qualifying questions, decides fit, tags the lead in CRM, and hands hot intent to Scheduler or the owner.',
    channel: 'inbound',
    priority: 2,
  },
  {
    id: 'glo_scheduler',
    displayName: 'Glo Scheduler',
    shortName: 'Scheduler',
    tagline: 'Book · reschedule · confirm',
    description:
      'Schedules, reschedules, and confirms on the live GlowUP. calendar with real availability and client capture.',
    channel: 'both',
    priority: 3,
  },
  {
    id: 'glo_support',
    displayName: 'Glo Support',
    shortName: 'Support',
    tagline: 'FAQs before you escalate',
    description:
      'Handles hours, pricing ranges, services, policies, and common questions—then escalates when a human is needed.',
    channel: 'inbound',
    priority: 4,
  },
  {
    id: 'glo_followup',
    displayName: 'Glo Follow-Up',
    shortName: 'Follow-Up',
    tagline: 'Speed-to-lead · win-back',
    description:
      'Calls or messages new leads fast, follows missed inquiries, and re-engages older CRM leads to fill the book.',
    channel: 'outbound',
    priority: 5,
  },
]

export function getGloRole(id: string): GloVoiceRole | undefined {
  return GLO_VOICE_ROLES.find((r) => r.id === id)
}

/** How Reception should route rough intents */
export const GLO_ROUTING_HINTS: Record<string, GloVoiceRoleId> = {
  book: 'glo_scheduler',
  appointment: 'glo_scheduler',
  reschedule: 'glo_scheduler',
  cancel: 'glo_scheduler',
  price: 'glo_support',
  hours: 'glo_support',
  parking: 'glo_support',
  qualify: 'glo_sales',
  interested: 'glo_sales',
  consult: 'glo_sales',
  followup: 'glo_followup',
  missed: 'glo_followup',
}
