/** Client-side salon context for demo + progressive API wiring */

export interface SalonContext {
  name: string
  brandTone: string
  city: string
  hours?: string
  services: string[]
  externalBookingUrl: string
  /** Optional Google review link. Empty means Reputation will not invent one. */
  googleReviewUrl: string
  /** Owner-supplied rival notes. Empty = Competitor Scout will not invent a rival. */
  competitorNotes: string
  partnerOrg: string
  /** Free-text scale signal: solo chair → multi-location */
  teamSize?: string
  locations?: number
}

const STORAGE_KEY = 'glowup_salon_context_v1'

/** Demo floor — multi-stylist salon (not a one-chair sample) */
export const DEMO_STYLISTS = ['Amelia', 'Noor', 'Jordan', 'Priya', 'Front desk'] as const

export const DEFAULT_SALON: SalonContext = {
  name: 'Lumen Collective',
  brandTone: 'Soft & romantic',
  city: 'Los Angeles',
  services: ['Haircuts & styling', 'Color services', 'Balayage', 'Gloss + blowout', 'Signature facial'],
  externalBookingUrl: '',
  googleReviewUrl: '',
  competitorNotes: '',
  partnerOrg: '',
  teamSize: '6–10',
  locations: 2,
}

/** Public scale line — single stylist through multi-location */
export const SCALE_LINE =
  'One chair or multi-location floors — same GlowUP. OS, same Glo front desk.'

export function loadSalonContext(): SalonContext {
  if (typeof window === 'undefined') return DEFAULT_SALON
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SALON
    return { ...DEFAULT_SALON, ...JSON.parse(raw) as Partial<SalonContext> }
  } catch {
    return DEFAULT_SALON
  }
}

export function saveSalonContext(patch: Partial<SalonContext>) {
  if (typeof window === 'undefined') return
  const next = { ...loadSalonContext(), ...patch }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  return next
}
