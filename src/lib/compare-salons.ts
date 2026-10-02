/**
 * Public comparison facts for /compare/{slug}.
 * Competitor prices: published list only, plus “check their site”.
 * Do not invent occupancy, GlowUP. customer counts, or unpublished rates.
 * GlowUP. plan prices come from PRICING_PLANS — do not hardcode.
 */
import { FLOOR_PILOT_DAYS, PRICING_PLANS, TRIAL_DAYS } from './pricing'

export const COMPARE_SLUGS = [
  'vagaro',
  'gloss-genius',
  'fresha',
  'booksy',
  'boulevard',
  'mangomint',
] as const
export type CompareSlug = (typeof COMPARE_SLUGS)[number]

export type CompareRow = {
  id: 'calendar' | 'aiFrontDesk' | 'crm' | 'deposits' | 'socialApproval' | 'pricingModel'
  label: string
  glowup: string
  them: string
}

export type CompareFaq = { q: string; a: string }

export type ComparePage = {
  slug: CompareSlug
  competitor: string
  competitorSite: string
  seoTitle: string
  seoDescription: string
  kicker: string
  headline: string
  headlineEm: string
  /** 40–60 word direct answer for AI citations */
  directAnswer: string
  whoTheyAre: string
  glowupWins: string[]
  theyWin: string[]
  rows: CompareRow[]
  faqs: CompareFaq[]
}

const solo = PRICING_PLANS.find((p) => p.id === 'solo')!
const floor = PRICING_PLANS.find((p) => p.id === 'floor')!
const brand = PRICING_PLANS.find((p) => p.id === 'brand')!

const glowupPlans = `${solo.name} ${solo.priceLabel} / ${floor.name} ${floor.priceLabel} / ${brand.name} ${brand.priceLabel}+/location`
const glowupPriceFaq = `GlowUP. is ${glowupPlans} with Glo included.`

const GLOWUP = {
  calendar:
    'Native live multi-stylist calendar. Glo books real chairs on the floor book — not a sidecar widget.',
  aiFrontDesk:
    'Glo chat is included on paid plans and books the live calendar (open beta). Phone voice is coming soon.',
  crm: 'Client CRM with notes and visit history; Floor and Brand add formulas and floor-wide history.',
  deposits: 'Deposits path on paid plans to protect high-ticket services.',
  socialApproval:
    'Human-in-the-loop: Glow Concierge drafts; owners approve before anything is ready to post. Auto-post is not live.',
  pricingModel: `${glowupPlans}. Glo included. Not per-seat. Floor: ${FLOOR_PILOT_DAYS} days on the house, then ${floor.priceLabel}/mo. Solo: ${TRIAL_DAYS}-day trial. Open beta.`,
}

export const COMPARE_PAGES: Record<CompareSlug, ComparePage> = {
  vagaro: {
    slug: 'vagaro',
    competitor: 'Vagaro',
    competitorSite: 'https://www.vagaro.com/pro',
    seoTitle: 'GlowUP. vs Vagaro: Native Glo Desk vs Booking Marketplace',
    seoDescription:
      'GlowUP. vs Vagaro: Glo books the live multi-stylist calendar natively. Vagaro is booking plus marketplace; Vera receptionist is an add-on. Open beta.',
    kicker: 'Compare · GlowUP. vs Vagaro',
    headline: 'A salon OS with a native desk,',
    headlineEm: 'not a marketplace plus add-ons.',
    directAnswer:
      'Pick GlowUP. if you want Glo to book the live multi-stylist calendar as a native desk — plus owner-approved social — instead of a booking-and-marketplace stack with a separate receptionist add-on. Stay on Vagaro if you need their consumer marketplace, mature POS, payroll, or inventory modules GlowUP. does not claim to match. Open beta; voice is coming soon.',
    whoTheyAre:
      'Vagaro Pro is all-in-one salon, spa, wellness, and fitness software with online booking, employee calendars, and a consumer Vagaro Marketplace. It is a booking and marketplace tool with a long add-on catalog — not an AI-first salon OS.',
    glowupWins: [
      'Glo books the live multi-stylist calendar as a native feature (chat live in beta; voice coming soon)',
      'Human-in-the-loop social drafts with owner approval — not auto-post',
      `Continuous Solo → Floor → Brand OS (${solo.priceLabel} / ${floor.priceLabel} / ${brand.priceLabel}+/location), not per extra calendar as the growth story`,
    ],
    theyWin: [
      'Consumer Vagaro Marketplace listing and social booking widgets (app, Instagram, Facebook, Apple Maps)',
      'Mature POS, payroll, inventory, memberships, and fitness/spa modules GlowUP. does not claim to match',
      'Years of production edge cases and a large existing install base',
    ],
    rows: [
      {
        id: 'calendar',
        label: 'Calendar',
        glowup: GLOWUP.calendar,
        them: 'Employee calendars with waitlist and resource management. Online booking via Vagaro app, Marketplace, and social widgets.',
      },
      {
        id: 'aiFrontDesk',
        label: 'AI front desk',
        glowup: GLOWUP.aiFrontDesk,
        them: 'Vera Receptionist is a paid Connect chatbot add-on (not the core product). Text marketing may be required. Check vagaro.com for current add-on rates.',
      },
      {
        id: 'crm',
        label: 'CRM',
        glowup: GLOWUP.crm,
        them: 'Client profiles, history, loyalty, invoices, memberships, and packages.',
      },
      {
        id: 'deposits',
        label: 'Deposits',
        glowup: GLOWUP.deposits,
        them: 'Payments and related checkout sit behind Vagaro Merchant Services / premium add-ons. Check their site for deposits and no-show rules.',
      },
      {
        id: 'socialApproval',
        label: 'Social approval',
        glowup: GLOWUP.socialApproval,
        them: 'Marketplace listing, email marketing, and social booking widgets. Not a human-approval social studio.',
      },
      {
        id: 'pricingModel',
        label: 'Pricing model',
        glowup: GLOWUP.pricingModel,
        them: 'Published US list: promo $23.99/mo to start; extra calendars $10/mo each, up to seven licenses. Add-ons extra. Check vagaro.com for current rates.',
      },
    ],
    faqs: [
      {
        q: 'Who should pick GlowUP. instead of Vagaro?',
        a: 'Owners who want Glo to book the live multi-stylist calendar as a native desk, plus human-approved social, on one continuous OS. Stay on Vagaro if the Marketplace, POS, payroll, or inventory depth is the reason you bought it.',
      },
      {
        q: 'Does Vagaro have an AI receptionist?',
        a: 'Vagaro publishes Vera Receptionist as a paid Connect chatbot add-on, not the core product. GlowUP. includes Glo chat on paid plans to book the live calendar (open beta). Phone voice is coming soon.',
      },
      {
        q: 'Does GlowUP. have a consumer marketplace like Vagaro?',
        a: 'No. GlowUP. is a salon operating system (calendar, CRM, Glo, deposits, approved social). We do not run a consumer booking marketplace.',
      },
      {
        q: 'How does GlowUP. pricing compare to Vagaro?',
        a: `${glowupPriceFaq} Vagaro publishes a base subscription plus extra calendars and add-ons — check vagaro.com for current rates. We do not invent occupancy or GlowUP. customer counts.`,
      },
      {
        q: 'Can I migrate from Vagaro?',
        a: 'Yes. Migration is concierge, not a help-doc dump: export a CSV, map chairs and stylists with us on Zoom, and keep Vagaro live in parallel for 14 days. Cut over when the GlowUP. floor book is ready.',
      },
    ],
  },
  'gloss-genius': {
    slug: 'gloss-genius',
    competitor: 'Gloss Genius',
    competitorSite: 'https://glossgenius.com/pricing',
    seoTitle: 'GlowUP. vs Gloss Genius: Native Glo Desk vs Booking POS',
    seoDescription:
      'GlowUP. vs Gloss Genius: native Glo desk on the live floor book vs booking/POS software. Reception by GlossGenius is listed coming soon. Open beta.',
    kicker: 'Compare · GlowUP. vs Gloss Genius',
    headline: 'Live Glo on the floor book,',
    headlineEm: 'not a receptionist labeled coming soon.',
    directAnswer:
      'Pick GlowUP. if you need after-hours booking onto a live floor calendar and human-in-the-loop social. Glo chat is included on paid plans (open beta); voice is coming soon. Gloss Genius lists Reception as coming soon. Stay on Gloss Genius if you want their POS, card readers, and 2.6% processing — GlowUP. does not claim to replace that checkout stack.',
    whoTheyAre:
      'Gloss Genius is beauty and wellness booking, payments, and POS software with a booking website, client profiles, and marketing tools. Reception by GlossGenius (calls and texts that book the calendar) is published as coming soon — an add-on path, not a live native desk.',
    glowupWins: [
      'Glo chat is included and books the live multi-stylist calendar today (open beta)',
      'Human-in-the-loop social: drafts wait for owner approval; auto-post is not live',
      `Same OS from Solo ${solo.priceLabel} to Floor ${floor.priceLabel} to Brand ${brand.priceLabel}+/location — not a re-platform when you add chairs`,
    ],
    theyWin: [
      'Mature POS, card readers, Tap to Pay, and a published flat 2.6% processing rate',
      'Built-in deposits, card-on-file, and cancellation policies in their booking flow',
      'Payroll add-on, inventory, and a long production feature list GlowUP. does not claim to match',
    ],
    rows: [
      {
        id: 'calendar',
        label: 'Calendar',
        glowup: GLOWUP.calendar,
        them: '24/7 online booking, multi-provider scheduling, drag-and-drop desktop calendar, waitlist, gap and processing time.',
      },
      {
        id: 'aiFrontDesk',
        label: 'AI front desk',
        glowup: GLOWUP.aiFrontDesk,
        them: 'Reception by GlossGenius (calls and texts that book the calendar) is listed as coming soon. AI marketing assistant exists on plans; that is not a live AI receptionist.',
      },
      {
        id: 'crm',
        label: 'CRM',
        glowup: GLOWUP.crm,
        them: 'Client profiles, notes, history, forms and waivers, rebooking reminders.',
      },
      {
        id: 'deposits',
        label: 'Deposits',
        glowup: GLOWUP.deposits,
        them: 'Built-in deposits, card-on-file, and cancellation / no-show policies in booking.',
      },
      {
        id: 'socialApproval',
        label: 'Social approval',
        glowup: GLOWUP.socialApproval,
        them: 'Social media templates plus AI-powered email and SMS marketing. Not an owner-approval social studio.',
      },
      {
        id: 'pricingModel',
        label: 'Pricing model',
        glowup: GLOWUP.pricingModel,
        them: 'Published Standard / Gold / Platinum from $24 / $48 / $148 per month billed annually (monthly list is higher). Reception coming soon. Check glossgenius.com.',
      },
    ],
    faqs: [
      {
        q: 'Who should pick GlowUP. instead of Gloss Genius?',
        a: 'Owners who need Glo to book the live floor calendar after hours and want social that waits for approval. Stay on Gloss Genius if POS, card readers, and their processing rate are the product you bought.',
      },
      {
        q: 'Is Gloss Genius Reception live?',
        a: 'Gloss Genius lists Reception by GlossGenius as coming soon on its pricing page. GlowUP. Glo chat is included on paid plans in open beta and books the live calendar. Voice is coming soon on GlowUP.',
      },
      {
        q: 'Does GlowUP. replace Gloss Genius POS and card readers?',
        a: 'No. We do not claim to replace their POS, readers, or 2.6% processing stack. GlowUP. is a salon OS: live calendar, CRM, deposits path, Glo, and approved social.',
      },
      {
        q: 'How does social posting differ?',
        a: 'GlowUP. is human-in-the-loop: Concierge drafts, owners approve. Auto-post is not live. Gloss Genius publishes social templates and AI email/SMS marketing — a different job than an approval studio.',
      },
      {
        q: 'What does GlowUP. cost versus Gloss Genius?',
        a: `${glowupPriceFaq} Gloss Genius publishes Standard, Gold, and Platinum — check glossgenius.com for current rates. We do not invent GlowUP. customer counts.`,
      },
    ],
  },
  fresha: {
    slug: 'fresha',
    competitor: 'Fresha',
    competitorSite: 'https://www.fresha.com/pricing',
    seoTitle: 'GlowUP. vs Fresha: Salon OS vs Marketplace Booking',
    seoDescription:
      'GlowUP. vs Fresha: salon OS with included Glo desk vs marketplace booking. Fresha AI Concierge is a paid add-on. Open beta; check Fresha for current rates.',
    kicker: 'Compare · GlowUP. vs Fresha',
    headline: 'Included Glo on the live book,',
    headlineEm: 'not a marketplace plus concierge add-on.',
    directAnswer:
      'Pick GlowUP. if you want a salon OS where Glo books the live multi-stylist calendar as a native, included desk — not a marketplace booking tool plus a paid AI Concierge add-on. Stay on Fresha if consumer-app discovery and marketplace new-client traffic are the main growth channel. GlowUP. is open beta; we do not invent occupancy or customer counts.',
    whoTheyAre:
      'Fresha is salon booking software with a large consumer marketplace and apps. Clients can book via marketplace, direct links, Google, Instagram, and Facebook. AI Concierge (phone and messages that book the Fresha calendar) is an optional paid add-on, not the included core product.',
    glowupWins: [
      'Glo is native and included on paid plans — it books the live multi-stylist calendar (chat beta; voice coming soon)',
      'No marketplace commission model: GlowUP. is an owner OS, not a consumer discovery marketplace',
      'Human-in-the-loop social with owner approval',
    ],
    theyWin: [
      'Consumer marketplace and booking app that can send new clients (new-client marketplace fee applies)',
      'Mature POS, inventory, team payroll tools, and Google / Instagram / Facebook booking',
      'AI Concierge as a paid add-on that can book the Fresha calendar if you buy it',
    ],
    rows: [
      {
        id: 'calendar',
        label: 'Calendar',
        glowup: GLOWUP.calendar,
        them: 'Team calendars, waitlists, shift scheduling. Online booking via Fresha marketplace, direct links, Google, Instagram, and Facebook.',
      },
      {
        id: 'aiFrontDesk',
        label: 'AI front desk',
        glowup: GLOWUP.aiFrontDesk,
        them: 'AI Concierge is an optional add-on listed at $99.95 per location / month (minutes and messages included, then overage). Check fresha.com.',
      },
      {
        id: 'crm',
        label: 'CRM',
        glowup: GLOWUP.crm,
        them: 'Client management, consultation forms, notes, ratings and reviews.',
      },
      {
        id: 'deposits',
        label: 'Deposits',
        glowup: GLOWUP.deposits,
        them: 'Upfront payments, deposits, and cancellation / no-show fees via Fresha Payments (payments are optional). Check their site.',
      },
      {
        id: 'socialApproval',
        label: 'Social approval',
        glowup: GLOWUP.socialApproval,
        them: 'Marketplace discovery plus Instagram, Facebook, and Google booking. Marketing email/SMS allowances. Not a human-approval social studio.',
      },
      {
        id: 'pricingModel',
        label: 'Pricing model',
        glowup: GLOWUP.pricingModel,
        them: 'Published Independent $19.95/mo; Team $14.95 per bookable team member. Marketplace new-client commission (published 20% one-time, $6 minimum). Check fresha.com.',
      },
    ],
    faqs: [
      {
        q: 'Who should pick GlowUP. instead of Fresha?',
        a: 'Owners who want Glo included on the live multi-stylist calendar and do not want growth to depend on a consumer marketplace. Stay on Fresha if marketplace discovery is the main reason you use it.',
      },
      {
        q: 'Is Fresha’s AI Concierge included?',
        a: 'No. Fresha lists AI Concierge as an optional add-on at $99.95 per location per month, with included minutes and messages then overage. GlowUP. includes Glo chat on paid plans (open beta). Voice is coming soon.',
      },
      {
        q: 'Does GlowUP. list salons on a consumer marketplace?',
        a: 'No. GlowUP. is a salon operating system. Fresha’s marketplace can send new clients and charges a published one-time new-client commission — check fresha.com for current fees.',
      },
      {
        q: 'How does GlowUP. pricing compare to Fresha?',
        a: `${glowupPriceFaq} Fresha publishes Independent and Team subscriptions plus marketplace commission and add-ons — check fresha.com. We do not invent occupancy or GlowUP. customer counts.`,
      },
      {
        q: 'Can I migrate from Fresha?',
        a: 'Yes. Export clients, services, and open appointments, map them onto the GlowUP. multi-stylist calendar on a Zoom, and keep Fresha live in parallel for 14 days.',
      },
    ],
  },
  booksy: {
    slug: 'booksy',
    competitor: 'Booksy',
    competitorSite: 'https://booksy.com/biz/en-us',
    seoTitle: 'GlowUP. vs Booksy: Salon OS vs Marketplace Booking',
    seoDescription:
      'GlowUP. vs Booksy for multi-stylist floors. Glo books the live calendar after hours. Booksy is a consumer marketplace for independent pros. Open beta.',
    kicker: 'Compare · GlowUP. vs Booksy',
    headline: 'A floor book with Glo,',
    headlineEm: 'not a marketplace for one chair.',
    directAnswer:
      'Pick GlowUP. if you run a multi-stylist floor and want Glo to book the live calendar after hours, with deposits on that same book. Booksy is a consumer marketplace and booking app built to help independent pros get discovered. Stay on Booksy if marketplace traffic is why the chair stays full. GlowUP. does not run a consumer marketplace. Open beta.',
    whoTheyAre:
      'Booksy Biz is booking software with a consumer Booksy app. Independent stylists and booth renters use it to be found and to take appointments. It is a discovery marketplace, not a native AI desk for a multi-stylist floor.',
    glowupWins: [
      'Glo is included on paid plans and books the live multi-stylist calendar (chat beta; voice coming soon)',
      'Floor plan is one location, not a per-chair marketplace listing',
      'Concierge switch: CSV, Zoom, and 14 days in parallel with the current book',
    ],
    theyWin: [
      'Consumer Booksy app that can send new clients to independent pros',
      'A long install base among booth and suite stylists',
      'Marketplace discovery GlowUP. does not offer',
    ],
    rows: [
      {
        id: 'calendar',
        label: 'Calendar',
        glowup: GLOWUP.calendar,
        them: 'Online booking for the pro, often one calendar, plus marketplace discovery in the Booksy app.',
      },
      {
        id: 'aiFrontDesk',
        label: 'AI front desk',
        glowup: GLOWUP.aiFrontDesk,
        them: 'Booksy is booking and marketplace software. We do not claim a native AI receptionist on their live floor book — check booksy.com for current features.',
      },
      {
        id: 'crm',
        label: 'CRM',
        glowup: GLOWUP.crm,
        them: 'Client list and visit tools aimed at the individual pro. Check booksy.com for current CRM depth.',
      },
      {
        id: 'deposits',
        label: 'Deposits',
        glowup: GLOWUP.deposits,
        them: 'Payments and no-show tools depend on their current checkout. Check booksy.com — we do not invent their rates.',
      },
      {
        id: 'socialApproval',
        label: 'Social approval',
        glowup: GLOWUP.socialApproval,
        them: 'Marketplace profile and promotions. Not an owner-approval social studio.',
      },
      {
        id: 'pricingModel',
        label: 'Pricing model',
        glowup: GLOWUP.pricingModel,
        them: 'Published subscription for Booksy Biz, plus marketplace visibility. Rates change — check booksy.com/biz. We do not reprint a number we have not verified this week.',
      },
    ],
    faqs: [
      {
        q: 'Who should pick GlowUP. instead of Booksy?',
        a: 'Owners of multi-stylist floors who need one live book and Glo after hours. Stay on Booksy if the consumer app is how new guests find a single chair.',
      },
      {
        q: 'Does GlowUP. replace Booksy’s marketplace?',
        a: 'No. GlowUP. does not list salons in a consumer app or charge a marketplace commission. Guests book the chairs you already have.',
      },
      {
        q: 'Is Booksy the right tool for a booth renter?',
        a: 'Often yes. Booth and suite pros who live on marketplace discovery are not the Floor pilot. GlowUP. Solo exists, but this launch is for multi-stylist floors.',
      },
      {
        q: 'How does GlowUP. pricing compare to Booksy?',
        a: `${glowupPriceFaq} Booksy publishes Biz plans and marketplace terms — check booksy.com for current rates. We do not invent occupancy or GlowUP. customer counts.`,
      },
      {
        q: 'Can I migrate from Booksy?',
        a: 'Yes. Export clients and services, map them on a Zoom, and keep Booksy live in parallel for 14 days while the GlowUP. book settles.',
      },
    ],
  },
  boulevard: {
    slug: 'boulevard',
    competitor: 'Boulevard',
    competitorSite: 'https://www.boulevard.com/',
    seoTitle: 'GlowUP. vs Boulevard: Included Glo Desk vs Salon Suite',
    seoDescription:
      'GlowUP. vs Boulevard: included AI receptionist on the live floor book vs a premium salon and spa suite. Floor pilot $149, 30 days on the house. Open beta.',
    kicker: 'Compare · GlowUP. vs Boulevard',
    headline: 'Glo included on the book,',
    headlineEm: 'not a suite you demo first.',
    directAnswer:
      'Pick GlowUP. if the job is an included AI receptionist on the live multi-stylist book. Boulevard is established salon and spa software for booking, clienteling, and checkout. Stay there if that operations depth is what the floor already runs. Check boulevard.com for current pricing. GlowUP. Floor is public. Open beta.',
    whoTheyAre:
      'Boulevard is salon and spa management software sold to established multi-service businesses: scheduling, client records, and point of sale. Pricing is typically discussed on a demo. It is not positioned as an included after-hours AI desk.',
    glowupWins: [
      'Glo chat is included on the Floor plan and books the live calendar (open beta)',
      `Public price: Floor ${floor.priceLabel}/mo, ${FLOOR_PILOT_DAYS} days on the house — not a custom quote to see the number`,
      'Concierge migration with the current book in parallel for 14 days',
    ],
    theyWin: [
      'Deeper salon and spa operations, including checkout workflows GlowUP. does not claim to match',
      'A production install base in established multi-service businesses',
      'Clienteling features built for higher-touch service menus',
    ],
    rows: [
      {
        id: 'calendar',
        label: 'Calendar',
        glowup: GLOWUP.calendar,
        them: 'Multi-provider scheduling for salons and spas. Check boulevard.com for resource and room rules.',
      },
      {
        id: 'aiFrontDesk',
        label: 'AI front desk',
        glowup: GLOWUP.aiFrontDesk,
        them: 'Boulevard is operations software. We do not claim they ship an included AI receptionist on the live book — check boulevard.com.',
      },
      {
        id: 'crm',
        label: 'CRM',
        glowup: GLOWUP.crm,
        them: 'Client records and clienteling aimed at full-service salons and spas.',
      },
      {
        id: 'deposits',
        label: 'Deposits',
        glowup: GLOWUP.deposits,
        them: 'Checkout and card handling sit in their payments stack. Check boulevard.com for deposits and no-show rules.',
      },
      {
        id: 'socialApproval',
        label: 'Social approval',
        glowup: GLOWUP.socialApproval,
        them: 'Marketing tools vary by plan. Not an owner-approval social studio.',
      },
      {
        id: 'pricingModel',
        label: 'Pricing model',
        glowup: GLOWUP.pricingModel,
        them: 'Boulevard pricing is published or quoted on their site and changes. Check boulevard.com. We do not reprint an unverified rate.',
      },
    ],
    faqs: [
      {
        q: 'Who should pick GlowUP. instead of Boulevard?',
        a: 'Owners who want Glo included on the live floor calendar and a public Floor price. Stay on Boulevard if spa checkout depth is the product you bought.',
      },
      {
        q: 'Does GlowUP. replace Boulevard POS?',
        a: 'No. This pilot is native desk, live book, and deposits. We do not claim Boulevard’s checkout or spa operations depth.',
      },
      {
        q: 'Is Boulevard’s price public?',
        a: 'Check boulevard.com. GlowUP. Floor is $149/mo with 30 days on the house, then the card. We do not invent their quote or our customer counts.',
      },
      {
        q: 'How does the switch work?',
        a: 'CSV export, a Zoom to map chairs, and 14 days with the current book still live. Cut over when the GlowUP. floor is ready.',
      },
      {
        q: 'Is phone voice included?',
        a: 'Chat Glo is live in open beta and books the calendar. Phone voice is coming. Do not buy GlowUP. for a live phone agent today.',
      },
    ],
  },
  mangomint: {
    slug: 'mangomint',
    competitor: 'Mangomint',
    competitorSite: 'https://www.mangomint.com/',
    seoTitle: 'GlowUP. vs Mangomint: AI Receptionist vs Salon Software',
    seoDescription:
      'GlowUP. vs Mangomint: Glo books the live multi-stylist calendar after hours. Mangomint is modern salon scheduling and payments. Open beta. Check their site for rates.',
    kicker: 'Compare · GlowUP. vs Mangomint',
    headline: 'After-hours Glo on the book,',
    headlineEm: 'not another scheduling suite.',
    directAnswer:
      'Pick GlowUP. when you want Glo included on the live floor calendar after hours, and a concierge switch that keeps the current book in parallel. Mangomint is modern salon software for scheduling, payments, and client records. Stay if that book is already the one the floor trusts. Check mangomint.com for current rates. Open beta.',
    whoTheyAre:
      'Mangomint is salon and spa software known for a clean calendar, payments, and client records. Owners compare it with Vagaro when they want a calmer book. It is scheduling and payments software, not an included after-hours AI receptionist.',
    glowupWins: [
      'Glo chat books the live multi-stylist calendar and is included on paid plans',
      'Human-in-the-loop social: drafts wait for the owner',
      'Switch plan is explicit: CSV, Zoom, 14 days beside the current book',
    ],
    theyWin: [
      'A polished scheduling and payments product with a production track record',
      'Checkout and card flows GlowUP. does not claim to match',
      'Feature depth on forms, memberships, and retail that this pilot does not include',
    ],
    rows: [
      {
        id: 'calendar',
        label: 'Calendar',
        glowup: GLOWUP.calendar,
        them: 'Multi-staff scheduling with a modern calendar. Check mangomint.com for resources and rooms.',
      },
      {
        id: 'aiFrontDesk',
        label: 'AI front desk',
        glowup: GLOWUP.aiFrontDesk,
        them: 'Mangomint publishes scheduling, payments, and client tools. We do not claim they include an AI receptionist on the live book — check mangomint.com.',
      },
      {
        id: 'crm',
        label: 'CRM',
        glowup: GLOWUP.crm,
        them: 'Client profiles, notes, and history aimed at salons and spas.',
      },
      {
        id: 'deposits',
        label: 'Deposits',
        glowup: GLOWUP.deposits,
        them: 'Payments and card-on-file sit in their checkout. Check mangomint.com for deposit and no-show rules.',
      },
      {
        id: 'socialApproval',
        label: 'Social approval',
        glowup: GLOWUP.socialApproval,
        them: 'Marketing messages may exist on their plans. Not an owner-approval social studio.',
      },
      {
        id: 'pricingModel',
        label: 'Pricing model',
        glowup: GLOWUP.pricingModel,
        them: 'Mangomint publishes plan prices on mangomint.com and they change. Check their site. We do not reprint an unverified rate.',
      },
    ],
    faqs: [
      {
        q: 'Who should pick GlowUP. instead of Mangomint?',
        a: 'Owners whose leak is after-hours inquiries that never hit the live book. Stay on Mangomint if payments and the calendar you already trust are the product.',
      },
      {
        q: 'Does Mangomint include an AI receptionist?',
        a: 'Check mangomint.com for current automation. GlowUP. includes Glo chat on paid plans and it books the live calendar. Phone voice is not live yet.',
      },
      {
        q: 'Does GlowUP. replace Mangomint payments?',
        a: 'No. This pilot is the desk, the live book, and deposits. We do not claim their checkout stack.',
      },
      {
        q: 'How does GlowUP. pricing compare?',
        a: `${glowupPriceFaq} Mangomint publishes its own plans — check mangomint.com. We do not invent occupancy or GlowUP. customer counts.`,
      },
      {
        q: 'Can I migrate from Mangomint?',
        a: 'Yes. CSV export, a Zoom to map chairs, and 14 days with Mangomint still live. Cut over when the GlowUP. floor book is ready.',
      },
    ],
  },
}

export function isCompareSlug(slug: string): slug is CompareSlug {
  return (COMPARE_SLUGS as readonly string[]).includes(slug)
}

export function getComparePage(slug: string): ComparePage | undefined {
  if (!isCompareSlug(slug)) return undefined
  return COMPARE_PAGES[slug]
}

export function otherComparePages(slug: CompareSlug): ComparePage[] {
  return COMPARE_SLUGS.filter((s) => s !== slug).map((s) => COMPARE_PAGES[s])
}
