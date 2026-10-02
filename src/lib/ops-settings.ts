/** Salon ops settings — payments, messaging, multi-device sync key */

export type OpsSettings = {
  salonSyncKey: string
  /** Public Glo /book/ link — never the ops dump key */
  deskKey: string
  syncEnabled: boolean
  lastSyncedAt: string
  stripePaymentLink: string
  depositAmount: string
  depositCurrency: string
  /** Comma-separated service names that use the higher deposit */
  highTicketServices: string
  highTicketDeposit: string
  /** Hours before the visit when a cancel still keeps the deposit */
  cancelWindowHours: string
  ownerNotifyEmail: string
  ownerNotifyPhone: string
  studioName: string
  hours: string
  services: string[]
  city: string
  /** When true, messaging pipeline runs (queue + dispatch) */
  messagingEnabled: boolean
  /** Phase B: auto-send client confirm SMS/email on book */
  autoSmsOnBook: boolean
  /** Phase B: auto-send owner alert on book */
  autoOwnerAlert: boolean
  /** Phase B: mark deposit_requested + include Payment Link on confirm */
  autoDepositOnBook: boolean
}

const KEY = 'glowup_ops_settings_v1'

const DEFAULTS: OpsSettings = {
  salonSyncKey: '',
  deskKey: '',
  /** Phase A: multi-device on by default once a key exists */
  syncEnabled: true,
  lastSyncedAt: '',
  stripePaymentLink: '',
  depositAmount: '50',
  depositCurrency: 'USD',
  highTicketServices: 'Balayage, Color',
  highTicketDeposit: '100',
  cancelWindowHours: '24',
  ownerNotifyEmail: '',
  ownerNotifyPhone: '',
  studioName: 'Studio',
  hours: 'Tue–Sat 9:00 AM – 5:00 PM',
  services: [],
  city: '',
  messagingEnabled: true,
  autoSmsOnBook: true,
  autoOwnerAlert: true,
  autoDepositOnBook: false,
}

/** Platform Glo voice number (not salon owner phone) */
export const GLO_PLATFORM_PHONE = '+17372324091'

function canUse() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function loadOpsSettings(): OpsSettings {
  if (!canUse()) return { ...DEFAULTS }
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULTS }
    return { ...DEFAULTS, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULTS }
  }
}

export function saveOpsSettings(patch: Partial<OpsSettings>): OpsSettings {
  const next = { ...loadOpsSettings(), ...patch }
  if (canUse()) window.localStorage.setItem(KEY, JSON.stringify(next))
  return next
}

export function ensureSalonSyncKey(): string {
  const s = loadOpsSettings()
  if (s.salonSyncKey) return s.salonSyncKey
  const key = `gu_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`
  saveOpsSettings({ salonSyncKey: key, syncEnabled: true })
  return key
}

export function ensureDeskKey(): string {
  const s = loadOpsSettings()
  if (s.deskKey && s.deskKey.startsWith('gd_')) return s.deskKey
  const key = `gd_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`
  saveOpsSettings({ deskKey: key })
  return key
}

export function regenerateSalonSyncKey(): string {
  const key = `gu_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`
  const deskKey = `gd_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`
  saveOpsSettings({ salonSyncKey: key, deskKey, lastSyncedAt: '' })
  return key
}
