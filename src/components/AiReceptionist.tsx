import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Bot, CalendarPlus, MessageCircle, Send, UserPlus, X } from 'lucide-react'
import { loadSalonContext } from '../lib/demo-salon'
import {
  getBusinessDays,
  getOpenSlots,
  isValidPhone,
  matchDay,
  matchService,
  matchTime,
  mergeServices,
  shortHoldCode,
  type DayOption,
} from '../lib/booking-store'
import { book_appointment } from '../lib/mcp-booking-crm'
import { captureLead, listLeads, updateLeadStatus } from '../lib/leads-store'
import { applyGloActions, sendGloChat, type GloChatMessage } from '../lib/glo-chat-client'
import { gloDeskAction } from '../lib/glo-desk-client'
import { canUseLiveGlo, recordGloConversation } from '../lib/glo-usage'

type Msg = { role: 'bot' | 'user'; text: string }

type Step =
  | 'idle'
  | 'pick_service'
  | 'pick_day'
  | 'pick_time'
  | 'pick_name'
  | 'pick_phone'
  | 'confirm'
  | 'done'
  | 'faq'
  | 'lead_interest'
  | 'lead_service'
  | 'lead_name'
  | 'lead_phone'
  | 'lead_email'
  | 'lead_done'
  | 'reschedule_phone'
  | 'reschedule_day'
  | 'reschedule_time'
  | 'cancel_phone'

type Draft = {
  service?: string
  day?: DayOption
  time?: string
  clientName?: string
  clientPhone?: string
  interest?: string
  email?: string
  mode?: 'book' | 'lead'
}

type Props = {
  salonKey?: string
  salonName?: string
  services?: string[]
  hours?: string
  variant?: 'marketing' | 'tenant'
}

function openingFor(isTenant: boolean, salonName?: string): Msg[] {
  if (isTenant) {
    const name = salonName?.trim() || 'this studio'
    return [
      {
        role: 'bot',
        text: `Hi — I'm Glo for ${name}. I book this floor after hours. Chat anytime.`,
      },
    ]
  }
  return [
    {
      role: 'bot',
      text: "Hi — I'm Glo, the GlowUP. company desk. Chat here to see how Glo books. Salon clients use the studio's own Glo link. Phone voice is not live yet.",
    },
  ]
}

function homeChipsFor(isTenant: boolean) {
  return isTenant ? ['Book', 'Move my time', 'Cancel', 'Hours'] : ['Book', 'Get info / lead', 'Pricing', 'Hours']
}

function faqReply(input: string, opts: { isTenant: boolean; hours?: string; services: string[] }): string {
  const t = input.toLowerCase()
  const { isTenant, hours, services } = opts
  if (/(reschedule|move|change)/.test(t)) {
    return isTenant
      ? 'Tap “Move my time” — I’ll take the phone on the book, then a new day and time.'
      : 'Share the name and preferred new time, or book a new slot from the chips.'
  }
  if (/(cancel)/.test(t)) {
    return isTenant
      ? 'Tap Cancel and give the phone on the appointment. I’ll drop it from this studio’s book.'
      : 'Owners cancel from Dashboard → Calendar. Want me to take a lead instead?'
  }
  if (/(price|cost|how much)/.test(t)) {
    const priced = services.filter((s) => /\$\d/.test(s))
    if (priced.length) return `On this menu: ${priced.join(', ')}. Want me to book one?`
    if (isTenant) {
      const list = services.slice(0, 6).join(', ')
      return list
        ? `This studio lists ${list}. I don’t have prices on file unless they’re written on the menu. Want to book a time?`
        : 'No prices are published for this studio. I can still hold a time.'
    }
    return 'This is the GlowUP company desk — a demo of how Glo books. Real studios publish their own menu on their Glo link.'
  }
  if (/(hour|open|close)/.test(t)) {
    if (hours) return `Hours on this floor: ${hours}. I can still book after hours in this chat.`
    return isTenant
      ? 'The studio has not published hours yet. I can still hold a time in this chat.'
      : 'This company desk is a demo. Salon clients use their studio’s Glo link for real hours. Chat books the desk — phone voice coming soon.'
  }
  if (/(call glo|phone|call you|voice)/.test(t)) {
    return isTenant
      ? 'I book this floor in chat. Phone voice is not live yet.'
      : 'Chat here to see how Glo books. Salon clients use the studio’s own Glo link. Phone voice is not live yet.'
  }
  if (/(hello|hi|hey)/.test(t)) {
    return isTenant
      ? `Hello. I'm Glo for this floor. Book, move a time, cancel, or ask hours.`
      : `Hello. I'm Glo — the GlowUP company desk. Try “Book” to see the demo, or ask hours.`
  }
  return isTenant
    ? 'I can book this floor, move a time, cancel, or answer hours. Tap a chip below.'
    : 'I can show how Glo books, take a demo lead, or answer hours. Tap a chip below.'
}

export function AiReceptionist({
  salonKey,
  salonName,
  services: servicesProp,
  hours,
  variant = 'marketing',
}: Props) {
  const isTenant = Boolean(salonKey) || variant === 'tenant'
  const homeChips = homeChipsFor(isTenant)

  const [open, setOpen] = useState(isTenant)
  const [pulse, setPulse] = useState(!isTenant)
  const [input, setInput] = useState('')
  const [msgs, setMsgs] = useState<Msg[]>(() => openingFor(isTenant, salonName))
  const [typing, setTyping] = useState(false)
  const [step, setStep] = useState<Step>('idle')
  const [draft, setDraft] = useState<Draft>({})
  const [chips, setChips] = useState<string[]>(homeChips)
  const endRef = useRef<HTMLDivElement>(null)

  const salon = useMemo(
    () => (isTenant ? null : typeof window !== 'undefined' ? loadSalonContext() : null),
    [open, isTenant],
  )
  const services = useMemo(() => {
    if (isTenant) return (servicesProp ?? []).map((s) => s.trim()).filter(Boolean)
    return mergeServices(servicesProp ?? salon?.services ?? [])
  }, [isTenant, servicesProp, salon])
  const days = useMemo(() => getBusinessDays(5, true), [open])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs, typing, open, chips])

  useEffect(() => {
    const t = window.setTimeout(() => setPulse(false), 12000)
    return () => window.clearTimeout(t)
  }, [])

  function pushBot(text: string, nextChips?: string[]) {
    setMsgs((m) => [...m, { role: 'bot', text }])
    if (nextChips) setChips(nextChips)
  }

  function goHome(message?: string) {
    setDraft({})
    setStep('idle')
    setChips(homeChips)
    if (message) pushBot(message, homeChips)
  }

  function startLead(preInterest?: string) {
    setDraft({ mode: 'lead', interest: preInterest })
    setStep('lead_interest')
    if (preInterest) {
      setDraft({ mode: 'lead', interest: preInterest })
      setStep('lead_service')
      pushBot(`Got it — ${preInterest}. Which service are you curious about?`, [
        ...services.slice(0, 5),
        'Not sure yet',
        'Start over',
      ])
      return
    }
    pushBot('Happy to help. What are you looking for?', [
      'New client / consult',
      'Pricing info',
      ...(services.slice(0, 3) || ['Color / balayage', 'Cut & style']),
      'Start over',
    ])
  }

  function startBook(preService?: string | null) {
    setDraft({ mode: 'book' })
    if (preService) {
      setDraft({ mode: 'book', service: preService })
      setStep('pick_day')
      pushBot(`Great — ${preService}. Which day works?`, [...days.map((d) => d.weekday), 'Start over'])
      return
    }
    setStep('pick_service')
    const menu = services.length ? services.slice(0, 6) : []
    pushBot('Which service should I book?', [...menu, 'Start over'])
  }

  function startReschedule() {
    setDraft({})
    setStep('reschedule_phone')
    setChips([])
    pushBot('What phone number is on the appointment?')
  }

  function startCancelAppt() {
    setDraft({})
    setStep('cancel_phone')
    setChips([])
    pushBot('What phone number is on the appointment to cancel?')
  }

  async function loadSlots(day: DayOption, service?: string) {
    if (isTenant && salonKey) {
      const r = await gloDeskAction({
        action: 'slots',
        salonKey,
        service,
        dateISO: day.dateISO,
      })
      return r.slots?.filter(Boolean) ?? []
    }
    return getOpenSlots(day.dateISO, service || 'Service')
  }

  async function askTime(day: DayOption, service: string) {
    const daySlots = await loadSlots(day, service)
    if (daySlots.length === 0) {
      setStep('pick_day')
      pushBot(`${day.dateLabel} is full for ${service}. Pick another day:`, [
        ...days.map((d) => d.weekday),
        'Start over',
      ])
      return
    }
    setStep('pick_time')
    setDraft((d) => ({ ...d, service, day, mode: 'book' }))
    pushBot(`Openings on ${day.dateLabel} for ${service}:`, [...daySlots, 'Start over'])
  }

  function finishLead(email?: string) {
    const name = draft.clientName || 'Friend'
    const phone = draft.clientPhone || ''
    if (!phone) {
      pushBot('I still need a phone number to save your lead.')
      setStep('lead_phone')
      return
    }
    if (!isTenant) {
      captureLead({
        name,
        phone,
        email: email || draft.email,
        interest: draft.interest,
        serviceInterest: draft.service || draft.interest,
        fit: /price|consult|new/i.test(draft.interest || '') ? 'hot' : 'warm',
        source: 'website_chat',
        assignedGloRole: 'glo_sales',
        notes: 'Captured via Glo website chat',
      })
    }
    setStep('lead_done')
    setDraft({})
    pushBot(`You're on the list, ${name}. The studio can reach you at ${phone}. Want me to book a chair now?`, [
      'Book now',
      'Done',
    ])
  }

  async function confirmBook() {
    const { service, day, time, clientName, clientPhone } = draft
    if (!service || !day || !time || !clientName || !clientPhone) {
      goHome('Something was missing — let’s start again.')
      return
    }

    if (isTenant && salonKey) {
      const r = await gloDeskAction({
        action: 'book',
        salonKey,
        service,
        dateISO: day.dateISO,
        time,
        clientName,
        clientPhone,
        source: 'ai_receptionist',
      })
      if (!r.ok) {
        const msg = r.error || 'Couldn’t save on this studio’s book.'
        const slots = r.slots?.filter(Boolean) ?? []
        if (slots.length) {
          setStep('pick_time')
          pushBot(msg, [...slots, 'Start over'])
        } else {
          setStep('pick_day')
          pushBot(`${msg} Pick another day:`, [...days.map((d) => d.weekday), 'Start over'])
        }
        return
      }
      const code = r.confirmation_code || shortHoldCode(`${salonKey}-${day.dateISO}-${time}`)
      setStep('done')
      setDraft({})
      pushBot(
        `You're booked: ${service} · ${day.dateLabel} · ${time} · ${clientName}. Ref ${code}. Glo put it on this studio’s book.`,
        ['Book another', 'Done'],
      )
      return
    }

    const result = book_appointment({
      service,
      dateISO: day.dateISO,
      time,
      clientName,
      clientPhone,
      source: 'ai_receptionist',
    })
    if (!result.ok || !result.data) {
      const msg = result.error || 'Couldn’t save on this browser.'
      const slots = getOpenSlots(day.dateISO, service)
      if (slots.length) {
        setStep('pick_time')
        pushBot(msg, [...slots, 'Start over'])
      } else {
        setStep('pick_day')
        pushBot(`${msg} Pick another day:`, [...days.map((d) => d.weekday), 'Start over'])
      }
      return
    }
    const hit = listLeads().find(
      (l) => l.phone.replace(/\D/g, '').slice(-7) === clientPhone.replace(/\D/g, '').slice(-7),
    )
    if (hit) updateLeadStatus(hit.id, 'booked')
    const code = result.data.confirmation_code || shortHoldCode(result.data.appointment.id)
    setStep('done')
    setDraft({})
    pushBot(
      `You're booked: ${service} · ${day.dateLabel} · ${time} · ${clientName}. Ref ${code}. Glo put it on the live calendar.`,
      ['Book another', 'Get info / lead', 'Done'],
    )
  }

  async function finishReschedule(next: Draft) {
    if (!next.clientPhone || !next.day || !next.time) {
      goHome('Something was missing — let’s start again.')
      return
    }
    if (!isTenant || !salonKey) {
      goHome('Reschedule is for a studio’s own Glo link.')
      return
    }
    const r = await gloDeskAction({
      action: 'reschedule',
      salonKey,
      clientPhone: next.clientPhone,
      dateISO: next.day.dateISO,
      time: next.time,
      service: next.service,
    })
    if (!r.ok) {
      pushBot(r.error || 'Couldn’t move that time. Check the phone number or pick another slot.', [
        'Move my time',
        'Start over',
      ])
      setStep('idle')
      return
    }
    setStep('done')
    setDraft({})
    pushBot(`Moved. You’re now ${next.day.dateLabel} · ${next.time}.`, ['Book', 'Done'])
  }

  async function finishCancel(phone: string) {
    if (!isTenant || !salonKey) {
      goHome('Cancel is for a studio’s own Glo link.')
      return
    }
    const r = await gloDeskAction({
      action: 'cancel',
      salonKey,
      clientPhone: phone,
    })
    if (!r.ok) {
      pushBot(r.error || 'Couldn’t cancel with that number. Try again?', ['Cancel', 'Start over'])
      setStep('idle')
      return
    }
    setStep('done')
    setDraft({})
    pushBot('Cancelled. That chair is open again.', ['Book', 'Done'])
  }

  async function handleUserText(raw: string) {
    const text = raw.trim()
    if (!text) return
    const lower = text.toLowerCase()

    if (/^(start over|restart|never ?mind|menu)$/i.test(text) || lower === 'start over') {
      goHome('No problem — cleared. Book, or ask a question?')
      return
    }

    if (step === 'lead_interest') {
      setDraft((d) => ({ ...d, interest: text, mode: 'lead' }))
      setStep('lead_service')
      pushBot('Which service (or “not sure yet”)?', [...services.slice(0, 5), 'Not sure yet', 'Start over'])
      return
    }
    if (step === 'lead_service') {
      const s = matchService(text, services) || (lower.includes('sure') ? 'Not sure yet' : text)
      setDraft((d) => ({ ...d, service: s, mode: 'lead' }))
      setStep('lead_name')
      setChips([])
      pushBot('What’s your name?')
      return
    }
    if (step === 'lead_name') {
      if (text.length < 2) {
        pushBot('What name should the studio use?')
        return
      }
      setDraft((d) => ({ ...d, clientName: text }))
      setStep('lead_phone')
      pushBot(`Thanks, ${text}. Best mobile number?`)
      return
    }
    if (step === 'lead_phone') {
      if (!isValidPhone(text)) {
        pushBot('Need a valid phone (at least 7 digits).')
        return
      }
      setDraft((d) => ({ ...d, clientPhone: text }))
      setStep('lead_email')
      pushBot('Email? (or type skip)', ['skip'])
      return
    }
    if (step === 'lead_email') {
      const email = /^skip$/i.test(text) ? '' : text
      setDraft((d) => ({ ...d, email }))
      finishLead(email)
      return
    }
    if (step === 'lead_done') {
      if (/book/.test(lower)) {
        startBook()
        return
      }
      if (/call/.test(lower)) {
        pushBot(
          isTenant
            ? 'I book this floor in chat. Phone voice is not live yet.'
            : 'Phone voice is not live yet. Chat books the desk.',
          homeChips,
        )
        setStep('idle')
        return
      }
      goHome('Anything else?')
      return
    }

    if (step === 'confirm') {
      if (/confirm|yes|yep|book it|ok|okay|sure/.test(lower)) {
        await confirmBook()
        return
      }
      if (/no|change|edit/.test(lower)) {
        goHome('Okay — starting fresh.')
        return
      }
      pushBot('Tap Confirm booking or Start over.', ['Confirm booking', 'Start over'])
      return
    }

    if (step === 'done') {
      if (/book|another|again/.test(lower)) {
        startBook()
        return
      }
      if (/lead|info|callback/.test(lower) && !isTenant) {
        startLead()
        return
      }
      goHome("You're all set. I'm here if you need me.")
      return
    }

    if (step === 'reschedule_phone') {
      if (!isValidPhone(text)) {
        pushBot('Need a valid phone (at least 7 digits).')
        return
      }
      setDraft((d) => ({ ...d, clientPhone: text }))
      setStep('reschedule_day')
      pushBot('Which day should I move you to?', [...days.map((d) => d.weekday), 'Start over'])
      return
    }

    if (step === 'reschedule_day') {
      const day = matchDay(text, days)
      if (!day) {
        pushBot('Choose a day from the list.', [...days.map((d) => d.weekday), 'Start over'])
        return
      }
      const slots = await loadSlots(day, draft.service)
      if (!slots.length) {
        setStep('reschedule_day')
        pushBot(`${day.dateLabel} looks full. Pick another day:`, [...days.map((d) => d.weekday), 'Start over'])
        return
      }
      setDraft((d) => ({ ...d, day }))
      setStep('reschedule_time')
      pushBot(`Open times on ${day.dateLabel}:`, [...slots, 'Start over'])
      return
    }

    if (step === 'reschedule_time') {
      const day = draft.day
      if (!day) {
        goHome('Let’s restart the move.')
        return
      }
      const slots = await loadSlots(day, draft.service)
      const time = matchTime(text, slots)
      if (!time) {
        pushBot('Pick an open time:', [...slots, 'Start over'])
        return
      }
      const next = { ...draft, time, day }
      setDraft(next)
      await finishReschedule(next)
      return
    }

    if (step === 'cancel_phone') {
      if (!isValidPhone(text)) {
        pushBot('Need a valid phone (at least 7 digits).')
        return
      }
      await finishCancel(text)
      return
    }

    if (step === 'idle' || step === 'faq') {
      if (/move my time|reschedule|move my|change my/.test(lower) && isTenant) {
        startReschedule()
        return
      }
      if (/^cancel$|cancel my|cancel the/.test(lower) && isTenant) {
        startCancelAppt()
        return
      }
      if (/get info|lead|callback|more info|contact me|leave my|interested/.test(lower) && !isTenant) {
        startLead(text)
        return
      }
      if (/^book$|book |appointment|hold a|reserve/.test(lower) || matchService(text, services)) {
        const pre = matchService(text, services)
        startBook(pre)
        return
      }
      if (/avail|open|times|when can/.test(lower)) {
        setStep('pick_day')
        setDraft({ mode: 'book' })
        pushBot('Next open days — pick one:', [...days.map((d) => d.weekday), 'Start over'])
        return
      }
      if (/call glo|phone|call you|voice/.test(lower)) {
        pushBot(
          isTenant
            ? 'I book this floor in chat. Phone voice is not live yet.'
            : 'Chat here to see how Glo books. Salon clients use the studio’s own Glo link. Phone voice is not live yet.',
          homeChips,
        )
        return
      }
      setStep('faq')
      pushBot(faqReply(text, { isTenant, hours, services }), homeChips)
      setStep('idle')
      return
    }

    if (step === 'pick_service') {
      const s = matchService(text, services) || services.find((x) => x.toLowerCase() === lower) || (services.length === 0 ? text : null)
      if (!s) {
        pushBot('Pick a service from the chips, or type the name.', [...services.slice(0, 6), 'Start over'])
        return
      }
      if (draft.day) {
        await askTime(draft.day, s)
        return
      }
      setDraft({ mode: 'book', service: s })
      setStep('pick_day')
      pushBot(`Locked in ${s}. Which day?`, [...days.map((d) => d.weekday), 'Start over'])
      return
    }

    if (step === 'pick_day') {
      const day = matchDay(text, days)
      if (!day) {
        pushBot('Choose a day from the list.', [...days.map((d) => d.weekday), 'Start over'])
        return
      }
      if (draft.service) {
        await askTime(day, draft.service)
        return
      }
      setDraft({ mode: 'book', day })
      setStep('pick_service')
      pushBot(`${day.dateLabel} — which service?`, [...services.slice(0, 6), 'Start over'])
      return
    }

    if (step === 'pick_time') {
      const day = draft.day
      const service = draft.service
      if (!day || !service) {
        goHome('Let’s restart the booking.')
        return
      }
      const slots = await loadSlots(day, service)
      const time = matchTime(text, slots)
      if (!time) {
        pushBot('Pick an open time:', [...slots, 'Start over'])
        return
      }
      setDraft((d) => ({ ...d, time }))
      setStep('pick_name')
      setChips([])
      pushBot('Name for the appointment?')
      return
    }

    if (step === 'pick_name') {
      if (text.length < 2) {
        pushBot('What’s the name on the appointment?')
        return
      }
      setDraft((d) => ({ ...d, clientName: text }))
      setStep('pick_phone')
      pushBot(`Thanks, ${text}. Best phone number?`)
      return
    }

    if (step === 'pick_phone') {
      if (!isValidPhone(text)) {
        pushBot('Need a valid phone (at least 7 digits).')
        return
      }
      const next = { ...draft, clientPhone: text }
      setDraft(next)
      setStep('confirm')
      pushBot(
        `Confirm booking:\n${next.service} · ${next.day?.dateLabel} · ${next.time} · ${next.clientName} · ${text}`,
        ['Confirm booking', 'Start over'],
      )
      return
    }
  }

  function isStructuredStep(s: Step) {
    return s !== 'idle' && s !== 'faq'
  }

  function msgsToHistory(nextUser: string): GloChatMessage[] {
    const hist: GloChatMessage[] = msgs
      .filter((m) => m.text)
      .map((m) => ({
        role: m.role === 'bot' ? ('assistant' as const) : ('user' as const),
        content: m.text,
      }))
    hist.push({ role: 'user', content: nextUser })
    return hist.slice(-16)
  }

  async function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed) return
    setMsgs((m) => [...m, { role: 'user', text: trimmed }])
    setInput('')
    setTyping(true)

    if (isStructuredStep(step)) {
      window.setTimeout(() => {
        void (async () => {
          await handleUserText(trimmed)
          setTyping(false)
        })()
      }, 400)
      return
    }

    try {
      const gate = canUseLiveGlo()
      if (!gate.allowed) {
        setTyping(false)
        pushBot(gate.reason || 'Glo AI limit reached — use the chips.', homeChips)
        await handleUserText(trimmed)
        return
      }
      const res = await sendGloChat(msgsToHistory(trimmed), 'auto', {
        salonName: salonName || undefined,
        hours: hours || undefined,
        services: services.length ? services : undefined,
        salonKey: salonKey || undefined,
      })
      setTyping(false)
      if (res.fallback || !res.reply) {
        await handleUserText(trimmed)
        return
      }
      const snap = recordGloConversation()
      const notes = await applyGloActions(res.actions, salonKey)
      let reply = notes.length ? `${res.reply}\n\n${notes.join(' ')}` : res.reply
      if (snap.atCap && !snap.overHardCap) {
        reply += `\n\n(Glo usage ${snap.used}/${snap.included} this month on ${snap.planName}.)`
      }
      pushBot(reply, homeChips)
      setStep('idle')
    } catch {
      setTyping(false)
      await handleUserText(trimmed)
    }
  }

  function onChip(label: string) {
    if (label === 'Done') {
      if (isTenant) {
        goHome('Here if you need me.')
        return
      }
      setOpen(false)
      return
    }
    if (label === 'Call Glo') {
      pushBot('Phone voice is not live yet. Chat books the desk.', homeChips)
      return
    }
    if (label === 'Book' || label === 'Book now' || label === 'Book another') {
      setMsgs((m) => [...m, { role: 'user', text: label }])
      setTyping(true)
      window.setTimeout(() => {
        setTyping(false)
        startBook()
      }, 300)
      return
    }
    if (label === 'Move my time') {
      setMsgs((m) => [...m, { role: 'user', text: label }])
      setTyping(true)
      window.setTimeout(() => {
        setTyping(false)
        startReschedule()
      }, 300)
      return
    }
    if (label === 'Cancel') {
      setMsgs((m) => [...m, { role: 'user', text: label }])
      setTyping(true)
      window.setTimeout(() => {
        setTyping(false)
        startCancelAppt()
      }, 300)
      return
    }
    if (label === 'Get info / lead') {
      setMsgs((m) => [...m, { role: 'user', text: label }])
      setTyping(true)
      window.setTimeout(() => {
        setTyping(false)
        startLead()
      }, 300)
      return
    }
    if (label === 'Confirm booking' || label === 'Confirm hold') {
      setMsgs((m) => [...m, { role: 'user', text: label }])
      setTyping(true)
      window.setTimeout(() => {
        void (async () => {
          await confirmBook()
          setTyping(false)
        })()
      }, 300)
      return
    }
    if (label === 'Pricing') {
      void send('How much is a gloss?')
      return
    }
    if (label === 'Hours') {
      void send('What are your hours?')
      return
    }
    if (label === 'Availability') {
      void send('What times are open?')
      return
    }
    void send(label)
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    void send(input)
  }

  return (
    <div className={`ai-rec-root ${isTenant ? 'ai-rec-embed' : ''}`} aria-live="polite">
      {!open && (
        <button
          type="button"
          className={`ai-rec-fab ${pulse ? 'ai-rec-fab-pulse' : ''}`}
          onClick={() => {
            setOpen(true)
            setPulse(false)
          }}
          aria-label="Open Glo AI chat"
        >
          <span className="ai-rec-fab-badge">Glo</span>
          <MessageCircle size={26} strokeWidth={1.75} />
          <span className="ai-rec-fab-label">
            <strong>Chat with Glo</strong>
            <small>{isTenant ? 'Book this floor' : 'See how Glo books'}</small>
          </span>
        </button>
      )}

      {open && (
        <section className="ai-rec-panel" role="dialog" aria-label="Glo AI desk">
          <header className="ai-rec-header">
            <div className="ai-rec-avatar">
              <Bot size={20} />
            </div>
            <div>
              <strong>{isTenant ? `Glo · ${salonName || 'this studio'}` : 'Glo · company desk'}</strong>
              <small>
                {isTenant ? 'After-hours chat · this floor' : 'Demo chat · voice coming soon'}
              </small>
            </div>
            {!isTenant && (
              <button type="button" className="ai-rec-close" onClick={() => setOpen(false)} aria-label="Close chat">
                <X size={18} />
              </button>
            )}
          </header>

          <div className="ai-rec-quick">
            {chips.length === 0 ? (
              <button type="button" onClick={() => onChip('Start over')}>
                <CalendarPlus size={14} /> Start over
              </button>
            ) : (
              chips.slice(0, 8).map((c) => (
                <button type="button" key={c} onClick={() => onChip(c)}>
                  {c === 'Book' || c === 'Book now' || c === 'Book another' ? <CalendarPlus size={14} /> : null}
                  {c === 'Get info / lead' ? <UserPlus size={14} /> : null}
                  {c}
                </button>
              ))
            )}
          </div>

          <div className="ai-rec-messages">
            {msgs.map((m, i) => (
              <div key={i} className={`ai-rec-msg ai-rec-msg-${m.role}`}>
                {m.text.split('\n').map((line, j) => (
                  <span key={j}>
                    {j > 0 && <br />}
                    {line}
                  </span>
                ))}
              </div>
            ))}
            {typing && <div className="ai-rec-msg ai-rec-msg-bot ai-rec-typing">Typing…</div>}
            <div ref={endRef} />
          </div>

          <form className="ai-rec-form" onSubmit={onSubmit}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                step.startsWith('lead_') || step.startsWith('pick_') || step.startsWith('reschedule_') || step === 'cancel_phone'
                  ? 'Type your reply…'
                  : isTenant
                    ? 'Book, move, cancel, or ask hours…'
                    : 'Book a demo, leave a lead, or ask Glo…'
              }
              aria-label="Message Glo"
            />
            <button type="submit" aria-label="Send">
              <Send size={16} />
            </button>
          </form>
          <p className="ai-rec-footnote">
            {isTenant
              ? 'Glo books this studio after hours. Chat here — phone voice is not live yet.'
              : 'Glo chat (beta) books the live book. Phone voice coming soon.'}
          </p>
        </section>
      )}
    </div>
  )
}
