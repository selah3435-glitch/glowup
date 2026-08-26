/**
 * Debounced multi-device push after local book mutations (Phase A).
 * Safe no-op when sync disabled or offline.
 */

import { pushToCloud } from './cloud-sync'
import { ensureSalonSyncKey, loadOpsSettings, saveOpsSettings } from './ops-settings'

let timer: ReturnType<typeof setTimeout> | null = null
let inflight = false
let pending = false

/** Queue a cloud push (~800ms debounce). */
export function scheduleCloudPush(reason = 'mutate') {
  if (typeof window === 'undefined') return
  const settings = loadOpsSettings()
  if (!settings.syncEnabled) return
  if (!settings.salonSyncKey) return

  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    timer = null
    void flushCloudPush(reason)
  }, 800)
}

export async function flushCloudPush(reason = 'manual') {
  if (typeof window === 'undefined') return
  const settings = loadOpsSettings()
  if (!settings.syncEnabled || !settings.salonSyncKey) return

  if (inflight) {
    pending = true
    return
  }
  inflight = true
  try {
    const r = await pushToCloud()
    if (r.ok) {
      saveOpsSettings({ lastSyncedAt: r.updatedAt, syncEnabled: true })
      if (import.meta.env.DEV) {
        console.info('[ops-auto-sync] push ok', reason, r.updatedAt)
      }
    }
  } finally {
    inflight = false
    if (pending) {
      pending = false
      void flushCloudPush('coalesced')
    }
  }
}

/** Enable cloud sync and ensure a salon key exists. */
export function enableCloudSync(): string {
  const key = ensureSalonSyncKey()
  saveOpsSettings({ syncEnabled: true })
  return key
}
