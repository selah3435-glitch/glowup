/** Client helper — talk to Glo via /api/glo/chat; apply actions locally or via desk */

import { book_appointment } from './mcp-booking-crm'
import { captureLead, listLeads, updateLeadStatus } from './leads-store'
import { gloDeskAction } from './glo-desk-client'

export type GloChatMessage = { role: 'user' | 'assistant'; content: string }

export type GloAction =
  | {
      type: 'capture_lead'
      name: string
      phone: string
      email?: string
      serviceInterest?: string
      interest?: string
      fit?: 'hot' | 'warm' | 'nurture'
    }
  | {
      type: 'book'
      service: string
      dateISO: string
      time: string
      clientName: string
      clientPhone: string
    }
  | { type: 'none' }

export type GloChatResponse = {
  reply: string
  actions?: GloAction[]
  fallback?: boolean
  error?: string
}

export type GloChatExtras = {
  salonName?: string
  hours?: string
  services?: string[]
  salonKey?: string
}

export async function sendGloChat(
  messages: GloChatMessage[],
  mode: 'auto' | 'lead' | 'book' = 'auto',
  extras?: GloChatExtras,
): Promise<GloChatResponse> {
  try {
    const controller = new AbortController()
    const timer = window.setTimeout(() => controller.abort(), 45000)
    const res = await fetch('/api/glo/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        mode,
        salonName: extras?.salonName,
        hours: extras?.hours,
        services: extras?.services,
        salonKey: extras?.salonKey,
      }),
      signal: controller.signal,
    })
    window.clearTimeout(timer)
    const text = await res.text()
    try {
      return JSON.parse(text) as GloChatResponse
    } catch {
      return {
        reply: '',
        fallback: true,
        error: `bad_response_${res.status}`,
      }
    }
  } catch (e) {
    return {
      reply: '',
      fallback: true,
      error: e instanceof Error ? e.message : 'network',
    }
  }
}

export async function applyGloActions(
  actions: GloAction[] | undefined,
  salonKey?: string,
): Promise<string[]> {
  if (!actions?.length) return []
  const notes: string[] = []
  for (const a of actions) {
    if (!a || a.type === 'none') continue
    if (a.type === 'capture_lead') {
      if (!a.phone || !a.name) continue
      if (salonKey) {
        notes.push(`Lead noted for ${a.name}.`)
        continue
      }
      captureLead({
        name: a.name,
        phone: a.phone,
        email: a.email,
        serviceInterest: a.serviceInterest,
        interest: a.interest || a.serviceInterest,
        fit: a.fit || 'warm',
        source: 'website_chat',
        assignedGloRole: 'glo_sales',
      })
      notes.push(`Lead saved for ${a.name}.`)
    }
    if (a.type === 'book') {
      if (salonKey) {
        const r = await gloDeskAction({
          action: 'book',
          salonKey,
          service: a.service,
          dateISO: a.dateISO,
          time: a.time,
          clientName: a.clientName,
          clientPhone: a.clientPhone,
          source: 'ai_receptionist',
        })
        if (r.ok) {
          notes.push(
            `Booked ${a.service} · ${a.dateISO} ${a.time}${r.confirmation_code ? ` (ref ${r.confirmation_code})` : ''}.`,
          )
        } else {
          notes.push(r.error || 'Booking failed — try the Book chip.')
        }
        continue
      }
      const r = book_appointment({
        service: a.service,
        dateISO: a.dateISO,
        time: a.time,
        clientName: a.clientName,
        clientPhone: a.clientPhone,
        source: 'ai_receptionist',
      })
      if (r.ok && r.data) {
        notes.push(`Booked ${a.service} · ${a.dateISO} ${a.time} (ref ${r.data.confirmation_code}).`)
        const hit = listLeads().find(
          (l) => l.phone.replace(/\D/g, '').slice(-7) === a.clientPhone.replace(/\D/g, '').slice(-7),
        )
        if (hit) updateLeadStatus(hit.id, 'booked')
      } else {
        notes.push(r.error || 'Booking failed — try the Book chip.')
      }
    }
  }
  return notes
}
