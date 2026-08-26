import {
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

/** Tenant root — salon / studio profile */
export const salons = pgTable('salons', {
  id: serial('id').primaryKey(),
  ownerId: text('owner_id').notNull().unique(),
  name: text('name').notNull(),
  businessType: text('business_type').notNull(),
  teamSize: text('team_size').notNull(),
  city: text('city').notNull(),
  phone: text('phone').notNull().default(''),
  services: jsonb('services').$type<string[]>().notNull(),
  brandTone: text('brand_tone').notNull(),
  /** v1 booking CTA — external URL (Square, Vagaro, site, etc.) */
  externalBookingUrl: text('external_booking_url').notNull().default(''),
  /** Optional ecosystem link e.g. jawsai911 */
  partnerOrg: text('partner_org').notNull().default(''),
  slug: text('slug').notNull().default(''),
  timezone: text('timezone').notNull().default('America/Los_Angeles'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const salonMembers = pgTable(
  'salon_members',
  {
    id: serial('id').primaryKey(),
    salonId: integer('salon_id')
      .notNull()
      .references(() => salons.id),
    userId: text('user_id').notNull(),
    role: text('role').notNull().$type<'owner' | 'manager' | 'stylist' | 'front_desk'>(),
    displayName: text('display_name').notNull().default(''),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [uniqueIndex('salon_members_salon_user').on(table.salonId, table.userId)],
)

export const growthSettings = pgTable('growth_settings', {
  id: serial('id').primaryKey(),
  salonId: integer('salon_id')
    .notNull()
    .references(() => salons.id)
    .unique(),
  stylistsRequireApproval: boolean('stylists_require_approval').notNull().default(true),
  quietHoursStart: text('quiet_hours_start').notNull().default('21:00'),
  quietHoursEnd: text('quiet_hours_end').notNull().default('09:00'),
  defaultPlatforms: jsonb('default_platforms').$type<string[]>().notNull().default(['facebook', 'instagram']),
  digestCadence: text('digest_cadence').notNull().default('weekly'),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const contentAssets = pgTable('content_assets', {
  id: serial('id').primaryKey(),
  salonId: integer('salon_id')
    .notNull()
    .references(() => salons.id),
  kind: text('kind').notNull().$type<'image' | 'video' | 'carousel_item'>(),
  storageKey: text('storage_key').notNull().default(''),
  publicUrl: text('public_url').notNull().default(''),
  mime: text('mime').notNull().default(''),
  altText: text('alt_text').notNull().default(''),
  clientConsent: boolean('client_consent').notNull().default(false),
  consentScope: jsonb('consent_scope').$type<string[]>().notNull().default([]),
  source: text('source').notNull().default('upload'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

/**
 * Social posts — assist publish phase uses ready + marked_posted.
 * Later: publishing / published via API.
 */
export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  salonId: integer('salon_id')
    .notNull()
    .references(() => salons.id),
  status: text('status')
    .notNull()
    .$type<
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
    >()
    .default('draft'),
  format: text('format').notNull().default('reel').$type<'reel' | 'post' | 'carousel' | 'story'>(),
  caption: text('caption').notNull().default(''),
  hashtags: jsonb('hashtags').$type<string[]>().notNull().default([]),
  platforms: jsonb('platforms').$type<string[]>().notNull().default(['facebook', 'instagram']),
  ctaUrl: text('cta_url').notNull().default(''),
  agentId: text('agent_id').notNull().default(''),
  sourceLabel: text('source_label').notNull().default(''),
  createdByUserId: text('created_by_user_id').notNull().default(''),
  createdByRole: text('created_by_role').notNull().default('owner'),
  approvedByUserId: text('approved_by_user_id').notNull().default(''),
  scheduledAt: timestamp('scheduled_at'),
  readyAt: timestamp('ready_at'),
  markedPostedAt: timestamp('marked_posted_at'),
  approvalNote: text('approval_note').notNull().default(''),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const conciergeSuggestions = pgTable('concierge_suggestions', {
  id: serial('id').primaryKey(),
  salonId: integer('salon_id')
    .notNull()
    .references(() => salons.id),
  agentId: text('agent_id').notNull(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  actionLabel: text('action_label').notNull().default('Use this'),
  actionKind: text('action_kind').notNull().default('open_studio'),
  payload: jsonb('payload').$type<Record<string, unknown>>().notNull().default({}),
  status: text('status').notNull().default('open').$type<'open' | 'accepted' | 'dismissed' | 'expired'>(),
  priority: integer('priority').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  expiresAt: timestamp('expires_at'),
})

export const agentRuns = pgTable('agent_runs', {
  id: serial('id').primaryKey(),
  salonId: integer('salon_id')
    .notNull()
    .references(() => salons.id),
  agentId: text('agent_id').notNull(),
  trigger: text('trigger').notNull().default('concierge'),
  input: jsonb('input').$type<Record<string, unknown>>().notNull().default({}),
  output: jsonb('output').$type<Record<string, unknown>>().notNull().default({}),
  status: text('status').notNull().default('completed').$type<'queued' | 'running' | 'completed' | 'failed'>(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const trendDigests = pgTable('trend_digests', {
  id: serial('id').primaryKey(),
  salonId: integer('salon_id')
    .notNull()
    .references(() => salons.id),
  periodLabel: text('period_label').notNull().default('This week'),
  items: jsonb('items')
    .$type<Array<{ title: string; why: string; agentId: string; angle: string }>>()
    .notNull()
    .default([]),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

/**
 * Phase A forward schema — appointments (Neon when DATABASE_URL lives).
 * Production pilot uses Netlify Blobs /api/ops snapshots until SQL cutover.
 */
export const appointments = pgTable('appointments', {
  id: text('id').primaryKey(),
  salonId: integer('salon_id')
    .notNull()
    .references(() => salons.id),
  status: text('status')
    .notNull()
    .$type<'confirmed' | 'cancelled' | 'completed' | 'no_show'>()
    .default('confirmed'),
  paymentStatus: text('payment_status')
    .notNull()
    .$type<'unpaid' | 'deposit_requested' | 'paid' | 'waived'>()
    .default('unpaid'),
  depositAmount: text('deposit_amount').notNull().default(''),
  service: text('service').notNull(),
  durationMin: integer('duration_min').notNull().default(60),
  dateISO: text('date_iso').notNull(),
  dateLabel: text('date_label').notNull().default(''),
  time: text('time').notNull(),
  startMinutes: integer('start_minutes').notNull().default(0),
  clientName: text('client_name').notNull(),
  clientPhone: text('client_phone').notNull().default(''),
  clientEmail: text('client_email').notNull().default(''),
  stylist: text('stylist').notNull().default('Studio'),
  notes: text('notes').notNull().default(''),
  source: text('source')
    .notNull()
    .$type<'ai_receptionist' | 'owner' | 'migrated_hold'>()
    .default('owner'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const clients = pgTable(
  'clients',
  {
    id: text('id').primaryKey(),
    salonId: integer('salon_id')
      .notNull()
      .references(() => salons.id),
    name: text('name').notNull(),
    phone: text('phone').notNull().default(''),
    email: text('email').notNull().default(''),
    notes: text('notes').notNull().default(''),
    formulas: text('formulas').notNull().default(''),
    preferences: text('preferences').notNull().default(''),
    source: text('source')
      .notNull()
      .$type<'manual' | 'from_booking' | 'ai_receptionist'>()
      .default('manual'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [uniqueIndex('clients_salon_phone').on(table.salonId, table.phone)],
)

/** Maps Netlify Identity (or email) → salon book key for Phase A Blobs */
export const salonSyncKeys = pgTable(
  'salon_sync_keys',
  {
    id: serial('id').primaryKey(),
    salonId: integer('salon_id')
      .notNull()
      .references(() => salons.id),
    syncKey: text('sync_key').notNull().unique(),
    ownerIdentityId: text('owner_identity_id').notNull().default(''),
    ownerEmail: text('owner_email').notNull().default(''),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [uniqueIndex('salon_sync_identity').on(table.ownerIdentityId)],
)
