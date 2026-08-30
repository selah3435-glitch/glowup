/**
 * Public packaging — continuous OS from solo → floor → multi-location.
 * Hybrid: base subscription + included Glo AI + overage (not pure per-seat).
 */

export type PlanId = 'solo' | 'floor' | 'brand'

export type PricingPlan = {
  id: PlanId
  name: string
  tagline: string
  target: string
  priceMonthly: number
  /** cents for Stripe Checkout */
  priceCents: number
  priceLabel: string
  priceNote: string
  aiAllowance: string
  /** Included Glo chat conversations per calendar month */
  aiConversationsIncluded: number
  highlighted?: boolean
  cta: string
  includes: string[]
  scaling: string
  /** Stripe Checkout available for this plan */
  checkoutEnabled: boolean
}

export const BRAND_CONTACT_EMAIL = 'aaron.jawsai@gmail.com'
export const TRIAL_DAYS = 14
export const FLOOR_PILOT_DAYS = 30

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'solo',
    name: 'Solo',
    tagline: 'Booth · suite · independent',
    target: '1 stylist',
    priceMonthly: 39,
    priceCents: 3900,
    priceLabel: '$39',
    priceNote: '/mo · billed monthly',
    aiAllowance: '150 Glo AI conversations / mo included',
    aiConversationsIncluded: 150,
    cta: 'Start Solo · 14-day trial',
    checkoutEnabled: true,
    includes: [
      '1 live calendar + online booking',
      'Client CRM (notes & visit history)',
      'Glo AI front desk (chat)',
      'Deposits path',
      'Leads capture',
    ],
    scaling: 'Add chairs anytime → upgrade to Floor (no migration)',
  },
  {
    id: 'floor',
    name: 'Floor',
    tagline: 'Multi-stylist · one location',
    target: '3–10+ chairs',
    priceMonthly: 149,
    priceCents: 14900,
    priceLabel: '$149',
    priceNote: '/mo · most salons',
    aiAllowance: '1,000 Glo AI conversations / mo included',
    aiConversationsIncluded: 1000,
    highlighted: true,
    cta: 'Start Floor pilot · 30 days on the house',
    checkoutEnabled: true,
    includes: [
      'Multi-stylist live calendar spine',
      'Full CRM (formulas, preferences, history)',
      'Glo AI books into real chairs 24/7',
      'Team tools · owner approvals',
      'Deposits · SMS reminders',
      'Ops multi-device sync',
    ],
    scaling: 'Soft cap on chairs; AI packs if you outgrow included',
  },
  {
    id: 'brand',
    name: 'Brand',
    tagline: 'Multi-location · larger ops',
    target: '2+ locations',
    priceMonthly: 299,
    priceCents: 29900,
    priceLabel: '$299',
    priceNote: '/location / mo · custom quote',
    aiAllowance: '5,000 Glo AI conversations / mo included',
    aiConversationsIncluded: 5000,
    cta: 'Talk to us',
    checkoutEnabled: false,
    includes: [
      'Everything in Floor',
      'Multi-location admin',
      'Advanced reporting / analytics',
      'Priority support',
      'Custom AI routing by location',
    ],
    scaling: 'Per location + volume AI — continuous OS, not a re-platform',
  },
]

export const AI_OVERAGE_NOTE =
  'AI overage soft-caps at 120% of included; upgrade plan or wait for next month. Voice telephony may use a separate allowance.'

export const PRICING_COMPARE =
  'One platform vs booking software + a separate AI receptionist ($49–200+/mo). Glo is native and books the live multi-chair calendar.'

export const ANNUAL_DISCOUNT =
  'Floor: 30 days on the house, then $149/mo. Solo: 14-day trial. Not free forever. Annual discount available on request.'

export function getPlan(id: PlanId): PricingPlan {
  return PRICING_PLANS.find((p) => p.id === id) || PRICING_PLANS[1]
}

export function getSelectedPlanId(): PlanId {
  if (typeof window === 'undefined') return 'floor'
  try {
    const p = window.localStorage.getItem('glowup_selected_plan_v1') as PlanId | null
    if (p === 'solo' || p === 'floor' || p === 'brand') return p
  } catch {
    /* ignore */
  }
  return 'floor'
}

export function setSelectedPlanId(id: PlanId) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem('glowup_selected_plan_v1', id)
  } catch {
    /* ignore */
  }
}

export function planFromTeamSize(teamSize: string): PlanId {
  const t = teamSize.toLowerCase()
  if (t.includes('multi') || t.includes('11')) return 'brand'
  if (t.includes('just me') || t.includes('single')) return 'solo'
  return 'floor'
}
