/** Meter Glo AI conversations against plan monthly allowance */

import { getPlan, getSelectedPlanId, type PlanId } from './pricing'

const KEY = 'glowup_glo_usage_v1'

export type GloUsageMonth = {
  /** YYYY-MM */
  month: string
  conversations: number
  lastAt?: string
}

function canUse() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function currentMonthKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function read(): GloUsageMonth {
  const month = currentMonthKey()
  if (!canUse()) return { month, conversations: 0 }
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return { month, conversations: 0 }
    const p = JSON.parse(raw) as GloUsageMonth
    if (p.month !== month) return { month, conversations: 0 }
    return { month, conversations: Number(p.conversations) || 0, lastAt: p.lastAt }
  } catch {
    return { month, conversations: 0 }
  }
}

function write(u: GloUsageMonth) {
  if (!canUse()) return
  window.localStorage.setItem(KEY, JSON.stringify(u))
}

export type GloUsageSnapshot = {
  month: string
  used: number
  included: number
  remaining: number
  percent: number
  planId: PlanId
  /** true when used >= included */
  atCap: boolean
  /** hard soft-cap at 120% included */
  overHardCap: boolean
  planName: string
}

export function getGloUsageSnapshot(planId?: PlanId): GloUsageSnapshot {
  const id = planId || getSelectedPlanId()
  const plan = getPlan(id)
  const u = read()
  const included = plan.aiConversationsIncluded
  const used = u.conversations
  const remaining = Math.max(0, included - used)
  const percent = included > 0 ? Math.min(100, Math.round((used / included) * 100)) : 0
  return {
    month: u.month,
    used,
    included,
    remaining,
    percent,
    planId: id,
    atCap: used >= included,
    overHardCap: used >= Math.floor(included * 1.2),
    planName: plan.name,
  }
}

/** Record one successful Glo conversation (user message that got a live reply). */
export function recordGloConversation(): GloUsageSnapshot {
  const month = currentMonthKey()
  const cur = read()
  const next: GloUsageMonth = {
    month,
    conversations: (cur.month === month ? cur.conversations : 0) + 1,
    lastAt: new Date().toISOString(),
  }
  write(next)
  return getGloUsageSnapshot()
}

/**
 * Whether free-form live AI is allowed.
 * Soft cap: warn after included; hard soft-cap blocks live API after 120%.
 */
export function canUseLiveGlo(): { allowed: boolean; reason?: string; snap: GloUsageSnapshot } {
  const snap = getGloUsageSnapshot()
  if (snap.overHardCap) {
    return {
      allowed: false,
      reason: `Glo AI soft-cap reached (${snap.used}/${snap.included} on ${snap.planName}). Upgrade plan or wait until next month. Chips still work.`,
      snap,
    }
  }
  return { allowed: true, snap }
}
