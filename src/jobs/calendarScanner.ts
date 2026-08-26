/**
 * Nightly Fill the Book scan.
 *
 * Same shape as the BullMQ worker: tomorrow's empty chairs → overdue
 * high-value guest → copywriter → SMS/email outbox.
 *
 * GlowUP's book lives in the salon browser (localStorage + /api/ops).
 * Netlify functions cannot host a long-lived Redis worker, so this job
 * is a callable scan. Wrap processMarketingTrigger() in BullMQ later if
 * a Node worker + REDIS_URL is added — do not add Redis just for this.
 *
 * No invented occupancy. No required discount.
 */
import { generateSalonCampaign } from '../agents/marketingAgent'
import { routeCampaignToExternalApps } from '../integrations/webhookRouter'
import {
  getEmptySlotsForDate,
  getOverdueHighValueClient,
  type HighValueClient,
  type OpenChair,
} from '../lib/book-gaps'
import { loadOpsSettings } from '../lib/ops-settings'
import { toISODate } from '../lib/calendar-store'

export const MARKETING_QUEUE_NAME = 'SalonMarketingTriggers'
export const SCAN_STORE_KEY = 'glowup_calendar_scan_v1'
export const DEFAULT_QUIET_DAYS = 60

export type MarketingTriggerJob = {
  salonId: string
}

export type CalendarScanStatus = 'full_book' | 'no_match' | 'drafted' | 'queued'

export type CalendarScanResult = {
  ranAt: string
  salonId: string
  tomorrowISO: string
  emptySlotCount: number
  emptySlots: OpenChair[]
  targetClient: HighValueClient | null
  status: CalendarScanStatus
  message: string
  campaignId?: string
  suggestedChannel?: 'sms' | 'email'
  bodyText?: string
  subject?: string
  fallback?: boolean
  error?: string
  queuedMessageIds?: string[]
}

function resolveSalonId(explicit?: string): string {
  const key = explicit || loadOpsSettings().salonSyncKey.trim()
  return key || 'local'
}

function tomorrowDate(): Date {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d
}

export function loadLastScan(): CalendarScanResult | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(SCAN_STORE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as CalendarScanResult
  } catch {
    return null
  }
}

export function saveLastScan(result: CalendarScanResult): CalendarScanResult {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(SCAN_STORE_KEY, JSON.stringify(result))
  }
  return result
}

export function scannedToday(result: CalendarScanResult | null, salonId: string): boolean {
  if (!result) return false
  if (result.salonId !== salonId) return false
  return result.ranAt.slice(0, 10) === toISODate(new Date())
}

export async function processMarketingTrigger(
  job: MarketingTriggerJob,
  options: { quietDays?: number; reuseToday?: boolean } = {},
): Promise<CalendarScanResult> {
  const salonId = resolveSalonId(job.salonId)
  const quietDays = options.quietDays ?? DEFAULT_QUIET_DAYS

  if (options.reuseToday !== false) {
    const prev = loadLastScan()
    if (scannedToday(prev, salonId) && prev) return prev
  }

  console.log(`[Worker] Scanning calendar for Salon ID: ${salonId}`)

  const tomorrow = tomorrowDate()
  const emptySlots = getEmptySlotsForDate(salonId, tomorrow)
  const tomorrowISO = toISODate(tomorrow)

  if (emptySlots.length === 0) {
    const message = `[Worker] Salon ${salonId} is fully booked tomorrow. Perfect!`
    console.log(message)
    return saveLastScan({
      ranAt: new Date().toISOString(),
      salonId,
      tomorrowISO,
      emptySlotCount: 0,
      emptySlots: [],
      targetClient: null,
      status: 'full_book',
      message,
    })
  }

  const targetClient = getOverdueHighValueClient(salonId, quietDays)
  if (!targetClient) {
    const message = `[Worker] Found empty slots, but no matching overdue clients found.`
    console.log(message)
    return saveLastScan({
      ranAt: new Date().toISOString(),
      salonId,
      tomorrowISO,
      emptySlotCount: emptySlots.length,
      emptySlots: emptySlots.slice(0, 8),
      targetClient: null,
      status: 'no_match',
      message,
    })
  }

  console.log(`[Worker] Triggering AI for client: ${targetClient.name}`)
  const aiProposal = await generateSalonCampaign(
    targetClient.firstName,
    targetClient.lastServiceType,
    undefined,
    { kind: targetClient.kind },
  )

  const campaignId = `camp_${Date.now()}`
  const routed = await routeCampaignToExternalApps(
    {
      id: campaignId,
      campaignType: 'last_minute_fill',
      targetClientIds: [targetClient.id],
      suggestedChannel: aiProposal.suggestedChannel,
      generatedContent: {
        bodyText: aiProposal.bodyText,
        subject: aiProposal.subject,
      },
      scheduledTime: new Date(),
    },
    salonId,
    {
      name: targetClient.name,
      phone: targetClient.phone,
      email: targetClient.email,
    },
  )

  const queued = routed.queued.length > 0
  const message = queued
    ? `[Worker] Draft queued for ${targetClient.firstName} (${aiProposal.suggestedChannel}). Owner send from Campaigns.`
    : `[Worker] Draft ready for ${targetClient.firstName}. ${routed.skipped.join('; ') || 'No contact on file.'}`

  return saveLastScan({
    ranAt: new Date().toISOString(),
    salonId,
    tomorrowISO,
    emptySlotCount: emptySlots.length,
    emptySlots: emptySlots.slice(0, 8),
    targetClient,
    status: queued ? 'queued' : 'drafted',
    message,
    campaignId,
    suggestedChannel: aiProposal.suggestedChannel,
    bodyText: aiProposal.bodyText,
    subject: aiProposal.subject,
    fallback: aiProposal.fallback,
    error: aiProposal.error,
    queuedMessageIds: routed.queued.map((m) => m.id),
  })
}

/** Enqueue + run. Browser stand-in for marketingTriggerQueue.add(...) */
export async function enqueueMarketingScan(
  salonId?: string,
  options?: { quietDays?: number; force?: boolean },
): Promise<CalendarScanResult> {
  return processMarketingTrigger(
    { salonId: resolveSalonId(salonId) },
    { quietDays: options?.quietDays, reuseToday: options?.force ? false : true },
  )
}

/** Named like the pasted export so later BullMQ wiring stays drop-in. */
export const marketingTriggerQueue = {
  name: MARKETING_QUEUE_NAME,
  add: async (data: MarketingTriggerJob) => enqueueMarketingScan(data.salonId, { force: true }),
}
