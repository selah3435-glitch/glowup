/**
 * MCP tool façade — booking + CRM.
 * Same contract the MCP server will expose; Glo / web AI call these names only.
 * Backed by calendar-store + clients-store today (local); swap to API later.
 */

import {
  addAppointment,
  cancelAppointment,
  durationForService,
  formatDateLabel,
  getBusinessDays,
  getOpenSlots,
  listAppointments,
  listForDay,
  mergeServices,
  rescheduleAppointment,
  shortHoldCode,
  type Appointment,
} from './calendar-store'
import {
  appointmentsForClient,
  findClientByPhone,
  listClients,
  updateClient,
  upsertClientFromBooking,
  type Client,
} from './clients-store'
import { requestDeposit, getDepositUrl } from './payments'
import { queueMessage } from './notifications-store'
import { loadOpsSettings } from './ops-settings'

export const MCP_SERVER_ID = 'glowup-booking-crm'
export const MCP_SERVER_VERSION = '1.0.0'

export type McpSlot = {
  slot_id: string
  dateISO: string
  dateLabel: string
  time: string
  durationMin: number
  stylist: string
  service: string
}

export type McpToolResult<T = unknown> = {
  ok: boolean
  data?: T
  error?: string
  _meta?: { server: string; version: string; tool: string }
}

function meta(tool: string) {
  return { server: MCP_SERVER_ID, version: MCP_SERVER_VERSION, tool }
}

function ok<T>(tool: string, data: T): McpToolResult<T> {
  return { ok: true, data, _meta: meta(tool) }
}

function fail<T = never>(tool: string, error: string): McpToolResult<T> {
  return { ok: false, error, _meta: meta(tool) }
}

/** Discoverable tool list (for orchestrators / future MCP discover) */
export const MCP_TOOLS = [
  'check_availability',
  'book_appointment',
  'reschedule_appointment',
  'cancel_appointment',
  'get_client_profile',
  'search_clients',
  'update_client_notes',
  'log_interaction',
  'collect_deposit',
] as const

export type McpToolName = (typeof MCP_TOOLS)[number]

// ── Tools ──────────────────────────────────────────────────────────────

export function check_availability(input: {
  service?: string
  service_ids?: string[]
  date_range_days?: number
  preferred_stylist_id?: string
}): McpToolResult<{ slots: McpSlot[]; services: string[] }> {
  const tool = 'check_availability'
  try {
    const services = mergeServices()
    const service =
      input.service ||
      input.service_ids?.[0] ||
      services[0] ||
      'Cut & style'
    const days = getBusinessDays(input.date_range_days ?? 5)
    const slots: McpSlot[] = []
    for (const day of days) {
      for (const time of getOpenSlots(day.dateISO, service)) {
        slots.push({
          slot_id: `${day.dateISO}T${time}`,
          dateISO: day.dateISO,
          dateLabel: day.dateLabel,
          time,
          durationMin: durationForService(service),
          stylist: input.preferred_stylist_id || 'Studio',
          service,
        })
      }
    }
    return ok(tool, { slots, services })
  } catch (e) {
    return fail(tool, e instanceof Error ? e.message : 'availability failed')
  }
}

export function book_appointment(input: {
  service: string
  dateISO: string
  time: string
  clientName: string
  clientPhone: string
  clientEmail?: string
  notes?: string
  stylist?: string
  deposit?: boolean
  source?: Appointment['source']
}): McpToolResult<{
  appointment: Appointment
  confirmation_code: string
  deposit_url?: string | null
}> {
  const tool = 'book_appointment'
  try {
    if (!input.clientName?.trim() || !input.clientPhone?.trim()) {
      return fail(tool, 'clientName and clientPhone required')
    }
    const appointment = addAppointment({
      service: input.service,
      dateISO: input.dateISO,
      dateLabel: formatDateLabel(input.dateISO),
      time: input.time,
      clientName: input.clientName,
      clientPhone: input.clientPhone,
      stylist: input.stylist,
      notes: input.notes,
      source: input.source || 'ai_receptionist',
    })
    let deposit_url: string | null | undefined
    if (input.deposit) {
      const r = requestDeposit(appointment)
      deposit_url = r.url ?? getDepositUrl(appointment)
    }
    return ok(tool, {
      appointment,
      confirmation_code: shortHoldCode(appointment.id),
      deposit_url,
    })
  } catch (e) {
    return fail(tool, e instanceof Error ? e.message : 'book failed')
  }
}

export function reschedule_appointment(input: {
  appointment_id: string
  dateISO: string
  time: string
}): McpToolResult<{ appointment: Appointment }> {
  const tool = 'reschedule_appointment'
  try {
    const appointment = rescheduleAppointment(input.appointment_id, input.dateISO, input.time)
    return ok(tool, { appointment })
  } catch (e) {
    return fail(tool, e instanceof Error ? e.message : 'reschedule failed')
  }
}

export function cancel_appointment(input: {
  appointment_id: string
  reason?: string
}): McpToolResult<{ cancelled: boolean }> {
  const tool = 'cancel_appointment'
  const cancelled = cancelAppointment(input.appointment_id)
  if (!cancelled) return fail(tool, 'appointment not found')
  if (input.reason) {
    log_interaction({
      kind: 'cancel',
      appointment_id: input.appointment_id,
      note: input.reason,
    })
  }
  return ok(tool, { cancelled: true })
}

export function get_client_profile(input: {
  client_id?: string
  phone?: string
}): McpToolResult<{
  client: Client
  history: Appointment[]
  upcoming: Appointment[]
}> {
  const tool = 'get_client_profile'
  let client: Client | undefined
  if (input.client_id) {
    client = listClients().find((c) => c.id === input.client_id)
  } else if (input.phone) {
    client = findClientByPhone(input.phone)
  }
  if (!client) return fail(tool, 'client not found')
  const history = appointmentsForClient(client)
  const today = new Date().toISOString().slice(0, 10)
  return ok(tool, {
    client,
    history,
    upcoming: history.filter((a) => a.dateISO >= today && a.status === 'confirmed'),
  })
}

export function search_clients(input: {
  query?: string
  limit?: number
}): McpToolResult<{ clients: Client[] }> {
  const tool = 'search_clients'
  const q = (input.query || '').trim().toLowerCase()
  let clients = listClients()
  if (q) {
    clients = clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.formulas.toLowerCase().includes(q) ||
        c.notes.toLowerCase().includes(q),
    )
  }
  return ok(tool, { clients: clients.slice(0, input.limit ?? 20) })
}

export function update_client_notes(input: {
  client_id?: string
  phone?: string
  notes?: string
  formulas?: string
  preferences?: string
}): McpToolResult<{ client: Client }> {
  const tool = 'update_client_notes'
  let client: Client | undefined
  if (input.client_id) client = listClients().find((c) => c.id === input.client_id)
  else if (input.phone) client = findClientByPhone(input.phone)
  if (!client && input.phone) {
    client = upsertClientFromBooking({
      name: input.phone,
      phone: input.phone,
      notes: input.notes,
    })
  }
  if (!client) return fail(tool, 'client not found')
  const updated = updateClient(client.id, {
    notes: input.notes ?? client.notes,
    formulas: input.formulas ?? client.formulas,
    preferences: input.preferences ?? client.preferences,
  })
  if (!updated) return fail(tool, 'update failed')
  return ok(tool, { client: updated })
}

export function log_interaction(input: {
  kind: string
  note?: string
  client_id?: string
  phone?: string
  appointment_id?: string
}): McpToolResult<{ logged: true; id: string }> {
  const tool = 'log_interaction'
  const settings = loadOpsSettings()
  const msg = queueMessage({
    channel: 'email',
    to: settings.ownerNotifyEmail || 'owner@local',
    subject: `Interaction · ${input.kind}`,
    body: [
      `Kind: ${input.kind}`,
      input.client_id ? `Client: ${input.client_id}` : '',
      input.phone ? `Phone: ${input.phone}` : '',
      input.appointment_id ? `Appt: ${input.appointment_id}` : '',
      input.note || '',
    ]
      .filter(Boolean)
      .join('\n'),
    kind: 'custom',
    relatedAppointmentId: input.appointment_id,
  })
  return ok(tool, { logged: true, id: msg.id })
}

export function collect_deposit(input: {
  appointment_id: string
}): McpToolResult<{ url?: string; status: string }> {
  const tool = 'collect_deposit'
  const appt = listAppointments(true).find((a) => a.id === input.appointment_id)
  if (!appt) return fail(tool, 'appointment not found')
  const r = requestDeposit(appt)
  if (!r.ok) return fail(tool, r.error || 'deposit failed')
  return ok(tool, { url: r.url, status: 'deposit_requested' })
}

// ── Resources (read helpers) ───────────────────────────────────────────

export function resource_salon_services(): McpToolResult<{ services: string[] }> {
  return ok('resource:salon/services', { services: mergeServices() })
}

export function resource_salon_policies(): McpToolResult<{
  studioName: string
  depositAmount: string
  highTicketServices: string
  highTicketDeposit: string
  cancelWindowHours: string
  messagingEnabled: boolean
}> {
  const s = loadOpsSettings()
  return ok('resource:salon/policies', {
    studioName: s.studioName,
    depositAmount: s.depositAmount,
    highTicketServices: s.highTicketServices,
    highTicketDeposit: s.highTicketDeposit,
    cancelWindowHours: s.cancelWindowHours,
    messagingEnabled: s.messagingEnabled,
  })
}

export function resource_day_book(dateISO: string): McpToolResult<{ appointments: Appointment[] }> {
  return ok('resource:calendar/day', { appointments: listForDay(dateISO) })
}

/** Dispatcher for orchestrators that only know tool names */
export function callMcpTool(name: string, args: Record<string, unknown> = {}): McpToolResult {
  switch (name as McpToolName) {
    case 'check_availability':
      return check_availability(args as Parameters<typeof check_availability>[0])
    case 'book_appointment':
      return book_appointment(args as Parameters<typeof book_appointment>[0])
    case 'reschedule_appointment':
      return reschedule_appointment(args as Parameters<typeof reschedule_appointment>[0])
    case 'cancel_appointment':
      return cancel_appointment(args as Parameters<typeof cancel_appointment>[0])
    case 'get_client_profile':
      return get_client_profile(args as Parameters<typeof get_client_profile>[0])
    case 'search_clients':
      return search_clients(args as Parameters<typeof search_clients>[0])
    case 'update_client_notes':
      return update_client_notes(args as Parameters<typeof update_client_notes>[0])
    case 'log_interaction':
      return log_interaction(args as Parameters<typeof log_interaction>[0])
    case 'collect_deposit':
      return collect_deposit(args as Parameters<typeof collect_deposit>[0])
    default:
      return fail(name, `unknown tool: ${name}`)
  }
}
