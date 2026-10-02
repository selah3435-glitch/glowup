/** Studio drafts — local queue for stylist submit → Concierge approve. */

import type { GlowAgentId, PostStatus } from './glow-agents'

export const ASSIST_PLATFORMS = ['facebook', 'instagram', 'tiktok'] as const
export type AssistPlatform = (typeof ASSIST_PLATFORMS)[number]

export type StudioDraft = {
  id: string
  createdAt: string
  status: Extract<PostStatus, 'draft' | 'pending_approval' | 'approved' | 'scheduled' | 'ready' | 'marked_posted'>
  service: string
  caption: string
  variants: string[]
  platforms: string[]
  sourceLabel: string
  agentId: GlowAgentId
  author: string
  authorRole: 'owner' | 'stylist'
  consentFace: boolean
  consentBack: boolean
  /** YYYY-MM-DD the owner chose for the week wall */
  publishOn?: string
  postedPlatforms?: AssistPlatform[]
  postedAt?: string
}

const KEY = 'glowup_studio_drafts_v1'

function canUse() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function readAll(): StudioDraft[] {
  if (!canUse()) return []
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as StudioDraft[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeAll(list: StudioDraft[]) {
  if (!canUse()) return
  window.localStorage.setItem(KEY, JSON.stringify(list))
}

export function listDrafts(): StudioDraft[] {
  return readAll().sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function listPendingDrafts(): StudioDraft[] {
  return listDrafts().filter((d) => d.status === 'pending_approval')
}

export function listReadyDrafts(): StudioDraft[] {
  return listDrafts().filter((d) => d.status === 'approved' || d.status === 'ready' || d.status === 'scheduled')
}

export function scheduleDraft(id: string, publishOn: string): StudioDraft | null {
  const day = publishOn.trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null
  const all = readAll()
  const idx = all.findIndex((d) => d.id === id)
  if (idx < 0) return null
  const current = all[idx]
  if (current.status === 'pending_approval' || current.status === 'draft') return null
  all[idx] = {
    ...current,
    publishOn: day,
    status: current.status === 'marked_posted' ? 'marked_posted' : 'scheduled',
  }
  writeAll(all)
  return all[idx]
}

export function markDraftPosted(id: string, platform: AssistPlatform): StudioDraft | null {
  const all = readAll()
  const idx = all.findIndex((d) => d.id === id)
  if (idx < 0) return null
  const current = all[idx]
  if (current.status === 'pending_approval' || current.status === 'draft') return null
  const posted = new Set(current.postedPlatforms || [])
  posted.add(platform)
  all[idx] = {
    ...current,
    status: 'marked_posted',
    postedPlatforms: ASSIST_PLATFORMS.filter((name) => posted.has(name)),
    postedAt: new Date().toISOString(),
  }
  writeAll(all)
  return all[idx]
}

export function saveDraft(
  input: Omit<StudioDraft, 'id' | 'createdAt'> & { id?: string },
): StudioDraft {
  const now = new Date().toISOString()
  const existing = input.id ? readAll().find((d) => d.id === input.id) : undefined
  const draft: StudioDraft = {
    id: existing?.id || crypto.randomUUID(),
    createdAt: existing?.createdAt || now,
    status: input.status,
    service: input.service,
    caption: input.caption,
    variants: input.variants,
    platforms: input.platforms,
    sourceLabel: input.sourceLabel,
    agentId: input.agentId,
    author: input.author,
    authorRole: input.authorRole,
    consentFace: input.consentFace,
    consentBack: input.consentBack,
    publishOn: existing?.publishOn,
    postedPlatforms: existing?.postedPlatforms,
    postedAt: existing?.postedAt,
  }
  const rest = readAll().filter((d) => d.id !== draft.id)
  rest.push(draft)
  writeAll(rest)
  return draft
}

export function setDraftStatus(id: string, status: StudioDraft['status']): StudioDraft | null {
  const all = readAll()
  const idx = all.findIndex((d) => d.id === id)
  if (idx < 0) return null
  all[idx] = { ...all[idx], status }
  writeAll(all)
  return all[idx]
}
