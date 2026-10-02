/**
 * Public JSON-LD + homepage FAQ copy.
 * FAQ answers here are the only source for both the visible #faq section and FAQPage schema.
 * Entity graph (org / site / app) may appear site-wide. FAQPage is homepage-only.
 */
import { FLOOR_PILOT_DAYS, PRICING_PLANS, TRIAL_DAYS } from './pricing'

export const GLOWUP_SITE = 'https://glowupbeautysolutions.com'

const solo = PRICING_PLANS.find((p) => p.id === 'solo')!
const floor = PRICING_PLANS.find((p) => p.id === 'floor')!
const brand = PRICING_PLANS.find((p) => p.id === 'brand')!

function chatsLabel(n: number) {
  return n.toLocaleString('en-US')
}

export const GLOWUP_FAQ: ReadonlyArray<{ q: string; a: string }> = [
  {
    q: 'What is GlowUP.?',
    a: 'GlowUP. is the salon operating system for owners who run floors: live multi-stylist calendar, Glo AI receptionist, client CRM, and deposits on one spine. Same OS from solo/booth through Floor and Brand — not a booking widget you’ll outgrow.',
  },
  {
    q: 'What is Glo?',
    a: 'Glo is GlowUP.’s AI receptionist. Native to the OS, not a bolt-on phone bot. Chat Glo (open beta) answers after hours and books the live multi-stylist calendar. Phone voice is coming soon.',
  },
  {
    q: 'How much does GlowUP. cost?',
    a: `Floor is the plan most floors start on: ${floor.priceLabel}/mo, ${FLOOR_PILOT_DAYS} days on the house, then the card — ${chatsLabel(floor.aiConversationsIncluded)} Glo chats. Solo is ${solo.priceLabel}/mo with a ${TRIAL_DAYS}-day trial and ${chatsLabel(solo.aiConversationsIncluded)} Glo chats. Brand is ${brand.priceLabel}+/location. AI is included in every paid plan; packaging is hybrid, not per-seat.`,
  },
  {
    q: 'GlowUP. vs Vagaro / Gloss Genius / Fresha?',
    a: 'Vagaro, Gloss Genius, and Fresha are booking tools (marketplace or POS-first). GlowUP. is the salon OS: Glo is built in and books the live multi-stylist calendar, so you are not stacking a booker plus a separate AI receptionist ($49–200+/mo). Add chairs or a second location on the same spine — no forced re-platform.',
  },
  {
    q: 'Does Glo book the live calendar?',
    a: 'Yes. Glo books onto the live multi-stylist calendar — real chairs, not a voicemail or a bolt-on widget. Chat Glo is in open beta; phone voice is coming soon.',
  },
  {
    q: 'How do I start a Floor pilot?',
    a: `Floor is ${floor.priceLabel}/mo for a multi-stylist location, with ${FLOOR_PILOT_DAYS} days on the house, then the card. Glo chat is included. Migration is concierge: CSV export, a Zoom to map chairs, and your current book (often Vagaro) stays live in parallel for 14 days.`,
  },
  {
    q: 'Can I keep Vagaro running while I switch?',
    a: 'Yes. Switch cost is the real objection. We do not ask you to shut the current book off on day one. Export a CSV, map stylists with us on Zoom, and run Vagaro beside GlowUP. for 14 days. Cut over when the floor book is ready.',
  },
  {
    q: 'Is GlowUP. a salon marketplace?',
    a: 'No. GlowUP. is salon software for the owner: live multi-stylist calendar, CRM, deposits, and Glo. Guests book your chairs. We do not run a consumer marketplace that sends strangers for a commission.',
  },
]

const orgId = `${GLOWUP_SITE}/#organization`
const siteId = `${GLOWUP_SITE}/#website`
const appId = `${GLOWUP_SITE}/#software`
const faqId = `${GLOWUP_SITE}/#faq`
const logoUrl = `${GLOWUP_SITE}/brand/glowup-logo.jpg`

const offerBase = {
  '@type': 'Offer' as const,
  priceCurrency: 'USD',
  url: `${GLOWUP_SITE}/#pricing`,
}

/** Organization + WebSite + SoftwareApplication. No FAQPage — that is homepage-only. */
export const GLOWUP_ENTITY_JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': orgId,
      name: 'GlowUP.',
      legalName: 'GlowUP Beauty Solutions',
      url: `${GLOWUP_SITE}/`,
      logo: logoUrl,
      image: logoUrl,
      email: 'aaron.jawsai@gmail.com',
      slogan: 'Beauty Business, Beautifully Done.',
      description:
        'GlowUP. is the AI-powered salon operating system. Glo, the AI receptionist, books the live multi-stylist calendar. The same OS runs CRM, deposits, and growth as the floor adds chairs.',
    },
    {
      '@type': 'WebSite',
      '@id': siteId,
      url: `${GLOWUP_SITE}/`,
      name: 'GlowUP.',
      description:
        'GlowUP. is the salon operating system. Glo, the native AI receptionist, books the live multi-stylist calendar after hours. CRM, deposits, and growth on one OS. Open beta.',
      inLanguage: 'en-US',
      publisher: { '@id': orgId },
    },
    {
      '@type': 'SoftwareApplication',
      '@id': appId,
      name: 'GlowUP.',
      applicationCategory: 'BusinessApplication',
      applicationSubCategory: 'Salon operating system',
      operatingSystem: 'Web',
      url: `${GLOWUP_SITE}/`,
      image: logoUrl,
      description:
        'Salon OS with Glo, the native AI receptionist that books the live multi-stylist calendar — plus CRM and deposits. Starting plans Solo, Floor, and Brand ($299+/location, custom). Not a bolt-on phone bot. Open beta.',
      brand: { '@id': orgId },
      offers: [
        {
          ...offerBase,
          name: solo.name,
          price: String(solo.priceMonthly),
          description: `${solo.priceLabel}/month. ${chatsLabel(solo.aiConversationsIncluded)} Glo chats. ${TRIAL_DAYS}-day trial. ${solo.includes.join('; ')}.`,
        },
        {
          ...offerBase,
          name: floor.name,
          price: String(floor.priceMonthly),
          description: `${floor.priceLabel}/month. ${chatsLabel(floor.aiConversationsIncluded)} Glo chats. ${FLOOR_PILOT_DAYS} days on the house, then the card. ${floor.includes.join('; ')}.`,
        },
        {
          ...offerBase,
          name: brand.name,
          price: String(brand.priceMonthly),
          description: `From ${brand.priceLabel}/location/month or custom quote. ${chatsLabel(brand.aiConversationsIncluded)} Glo chats. ${brand.includes.join('; ')}.`,
        },
      ],
    },
  ],
}

export const GLOWUP_FAQ_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  '@id': faqId,
  url: `${GLOWUP_SITE}/#faq`,
  isPartOf: { '@id': siteId },
  mainEntity: GLOWUP_FAQ.map((item) => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.a,
    },
  })),
}
