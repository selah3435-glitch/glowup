/** Glow Agents catalog — product brand (not JAWSAI911 names in-app). */

export type GlowAgentId =
  | 'front_desk'
  | 'book_closer'
  | 'trend_scout'
  | 'chair_content'
  | 'shorts'
  | 'reputation'
  | 'retail_services'
  | 'fill_the_book'
  | 'copywriter'
  | 'competitor_scout'
  | 'lead_scout'
  | 'local_seo'
  | 'company_lead_scout'

export interface GlowAgent {
  id: GlowAgentId
  name: string
  tagline: string
  description: string
}

export const GLOW_AGENTS: GlowAgent[] = [
  {
    id: 'front_desk',
    name: 'Front Desk',
    tagline: 'Replies that sound like you',
    description: 'Comments, FAQs, hours, and basic inquiries with on-brand answers.',
  },
  {
    id: 'book_closer',
    name: 'Book Closer',
    tagline: 'Intent → booking link',
    description: 'Moves high-intent DMs and comments toward your external booking URL.',
  },
  {
    id: 'trend_scout',
    name: 'Trend Scout',
    tagline: 'What to post this week',
    description: 'Beauty and local demand signals turned into calm, actionable digest cards.',
  },
  {
    id: 'chair_content',
    name: 'Chair Content',
    tagline: 'From the chair to the feed',
    description: 'Turns service photos and notes into multi-lane post packs.',
  },
  {
    id: 'shorts',
    name: 'Shorts',
    tagline: 'Hooks for Reels & TikTok',
    description: 'Short-form hooks, captions, and first-comment CTAs.',
  },
  {
    id: 'reputation',
    name: 'Reputation',
    tagline: 'Reviews on autopilot',
    description: 'Post-visit review requests and 5-star moments ready for social.',
  },
  {
    id: 'retail_services',
    name: 'Retail & Services',
    tagline: 'Promote what you sell',
    description: 'Service spotlights and retail promos from your real menu.',
  },
  {
    id: 'fill_the_book',
    name: 'Fill the Book',
    tagline: 'Rebook · win-back · slow days',
    description: 'Campaign drafts that protect revenue and fill open chairs.',
  },
  {
    id: 'copywriter',
    name: 'Copywriter',
    tagline: 'Fill chairs without sounding cheap',
    description: 'Localized SMS, email, and social captions from your real menu.',
  },
  {
    id: 'competitor_scout',
    name: 'Competitor Scout',
    tagline: 'What we know — nothing invented',
    description: 'Nearby Google listings plus public $ on their sites. Missing prices stay “not listed.”',
  },
  {
    id: 'lead_scout',
    name: 'Lead Scout',
    tagline: 'Rank who is already in the book',
    description: 'Scores CRM and overdue guests on facts (phone, fit, recency). No fake close rate.',
  },
  {
    id: 'local_seo',
    name: 'Local SEO',
    tagline: 'Title, meta, GBP',
    description: 'On-page and Google Business drafts from name, city, and services.',
  },
  {
    id: 'company_lead_scout',
    name: 'Company Lead Scout',
    tagline: 'Salons to sell GlowUP to',
    description:
      'Ranks signups and hunted salons against the GlowUP ICP: friction + budget/tech-readiness. Facts only — not guest CRM.',
  },
]

export function getAgent(id: string): GlowAgent | undefined {
  return GLOW_AGENTS.find((agent) => agent.id === id)
}

/** Where the owner actually runs this agent (not the Concierge catalog). */
export const AGENT_HREF: Record<GlowAgentId, string> = {
  front_desk: '/dashboard/social/campaigns#front-desk',
  book_closer: '/dashboard/social/campaigns#book-closer',
  trend_scout: '/dashboard/social/campaigns#trend-scout',
  chair_content: '/dashboard/social/studio?from=chair',
  shorts: '/dashboard/social/campaigns#shorts',
  reputation: '/dashboard/social/campaigns#reputation',
  retail_services: '/dashboard/social/campaigns#retail',
  fill_the_book: '/dashboard/social/campaigns#fill-the-book',
  copywriter: '/dashboard/social/campaigns#copywriter',
  competitor_scout: '/dashboard/social/campaigns#competitor-scout',
  lead_scout: '/dashboard/social/campaigns#lead-scout',
  local_seo: '/dashboard/social/campaigns#local-seo',
  company_lead_scout: '/dashboard/platform#company-lead-scout',
}

export function agentHref(id: string): string | undefined {
  return AGENT_HREF[id as GlowAgentId]
}

export type PostStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'scheduled'
  | 'ready'
  | 'marked_posted'
  | 'publishing'
  | 'published'
  | 'failed'
  | 'archived'

/** Platform order locked by founder: Facebook → Instagram → TikTok → other */
export const PLATFORM_ORDER = ['facebook', 'instagram', 'tiktok', 'other'] as const

export interface DemoPost {
  id: string
  status: PostStatus
  format: 'reel' | 'post' | 'carousel' | 'story'
  caption: string
  platforms: string[]
  sourceLabel: string
  agentId: GlowAgentId
  author: string
  authorRole: 'owner' | 'stylist' | 'manager'
  scheduledLabel?: string
}

export interface ConciergeCard {
  id: string
  agentId: GlowAgentId
  title: string
  body: string
  actionLabel: string
  actionHref: string
}

/** Seed Concierge suggestions until LLM runtime is wired */
export function buildDemoConcierge(salonName: string, bookingUrl: string): ConciergeCard[] {
  const bookHint = bookingUrl ? 'Uses your external booking link.' : 'Add an external booking URL in Brand settings.'
  return [
    {
      id: 'c1',
      agentId: 'chair_content',
      title: 'Turn today’s gloss into a Reel draft',
      body: `Chair Content can draft a brand-toned Reel from your last gloss service at ${salonName}. Stylists submit; you approve.`,
      actionLabel: 'Open Studio',
      actionHref: AGENT_HREF.chair_content,
    },
    {
      id: 'c2',
      agentId: 'trend_scout',
      title: 'This week’s angle from your menu',
      body: 'Trend Scout uses your services, season, and live book. No invented rankings.',
      actionLabel: 'Open Trend Scout',
      actionHref: AGENT_HREF.trend_scout,
    },
    {
      id: 'c3',
      agentId: 'fill_the_book',
      title: '3 clients are ready to rebook',
      body: `Fill the Book drafted a soft social teaser. ${bookHint}`,
      actionLabel: 'Review campaign draft',
      actionHref: AGENT_HREF.fill_the_book,
    },
    {
      id: 'c4',
      agentId: 'reputation',
      title: 'Send review requests for yesterday',
      body: 'Reputation Agent prepared post-visit asks with a dual path to Google when clients are happy.',
      actionLabel: 'Review asks',
      actionHref: AGENT_HREF.reputation,
    },
  ]
}

export const DEMO_POSTS: DemoPost[] = [
  {
    id: 'p1',
    status: 'pending_approval',
    format: 'reel',
    caption:
      'Soft glass finish after gloss — light that moves with you. Book your next chair time when you are ready.',
    platforms: ['facebook', 'instagram'],
    sourceLabel: 'Maya · Gloss + blowout',
    agentId: 'shorts',
    author: 'Mina',
    authorRole: 'stylist',
    scheduledLabel: 'Thu 6:30p',
  },
  {
    id: 'p2',
    status: 'ready',
    format: 'post',
    caption: 'Dimensional color that still feels like you. Limited openings this Saturday.',
    platforms: ['facebook', 'instagram'],
    sourceLabel: 'Service spotlight · Color',
    agentId: 'retail_services',
    author: 'Amelia',
    authorRole: 'owner',
    scheduledLabel: 'Today 11:00a',
  },
  {
    id: 'p3',
    status: 'draft',
    format: 'reel',
    caption: 'Process, not perfection — a quiet look at a silk press set.',
    platforms: ['instagram', 'tiktok'],
    sourceLabel: 'Chair Content pack',
    agentId: 'chair_content',
    author: 'Noor',
    authorRole: 'stylist',
  },
  {
    id: 'p4',
    status: 'scheduled',
    format: 'post',
    caption: 'Your color refresh window is open. We saved a chair with your name on it.',
    platforms: ['facebook', 'instagram'],
    sourceLabel: 'Fill the Book · rebook',
    agentId: 'fill_the_book',
    author: 'Amelia',
    authorRole: 'owner',
    scheduledLabel: 'Sat 9:00a',
  },
]

export function statusLabel(status: PostStatus): string {
  const map: Record<PostStatus, string> = {
    draft: 'Draft',
    pending_approval: 'Needs approval',
    approved: 'Approved',
    scheduled: 'Scheduled',
    ready: 'Ready to post',
    marked_posted: 'Posted',
    publishing: 'Publishing',
    published: 'Published',
    failed: 'Failed',
    archived: 'Archived',
  }
  return map[status]
}
