/**
 * Public JSON-LD + homepage FAQ copy.
 * FAQ answers here are the only source for both the visible #faq section and FAQPage schema.
 */
import { PRICING_PLANS, TRIAL_DAYS } from './pricing'

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
    a: `Solo is ${solo.priceLabel}/month with ${chatsLabel(solo.aiConversationsIncluded)} Glo chats. Floor is ${floor.priceLabel}/month with ${chatsLabel(floor.aiConversationsIncluded)} Glo chats — the plan most salons start on. Brand is ${brand.priceLabel}+/location. ${TRIAL_DAYS}-day trial on Solo and Floor. AI is included in every paid plan; packaging is hybrid, not per-seat.`,
  },
  {
    q: 'GlowUP. vs Vagaro / Gloss Genius?',
    a: 'Vagaro and Gloss Genius are booking tools. GlowUP. is the salon OS: Glo is built in and books the live multi-stylist calendar, so you are not stacking a booker plus a separate AI receptionist ($49–200+/mo). Add chairs or a second location on the same spine — no forced re-platform.',
  },
  {
    q: 'Does Glo book the live calendar?',
    a: 'Yes. Glo books onto the live multi-stylist calendar — real chairs, not a voicemail or a bolt-on widget. Chat Glo is in open beta; phone voice is coming soon.',
  },
]

const orgId = `${GLOWUP_SITE}/#organization`
const siteId = `${GLOWUP_SITE}/#website`
const appId = `${GLOWUP_SITE}/#software`
const faqId = `${GLOWUP_SITE}/#faq`
const logoUrl = `${GLOWUP_SITE}/brand/glowup-logo.jpg`

export const GLOWUP_JSON_LD = {
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
        'Centralize booking, client CRM, and Glo AI after-hours chat. GlowUP. scales from solo independent stylists to high-volume multi-location salons.',
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
        'Salon OS with Glo, the native AI receptionist that books the live multi-stylist calendar — plus CRM and deposits. Not a bolt-on phone bot.',
      brand: { '@id': orgId },
      offers: [
        {
          '@type': 'Offer',
          name: solo.name,
          price: String(solo.priceMonthly),
          priceCurrency: 'USD',
          description: `${solo.priceLabel}/month. ${chatsLabel(solo.aiConversationsIncluded)} Glo chats. ${TRIAL_DAYS}-day trial. ${solo.includes.join('; ')}.`,
          url: `${GLOWUP_SITE}/#pricing`,
          availability: 'https://schema.org/InStock',
        },
        {
          '@type': 'Offer',
          name: floor.name,
          price: String(floor.priceMonthly),
          priceCurrency: 'USD',
          description: `${floor.priceLabel}/month. ${chatsLabel(floor.aiConversationsIncluded)} Glo chats. ${TRIAL_DAYS}-day trial. ${floor.includes.join('; ')}.`,
          url: `${GLOWUP_SITE}/#pricing`,
          availability: 'https://schema.org/InStock',
        },
      ],
    },
    {
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
    },
  ],
}
