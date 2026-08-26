import { createFileRoute, Link } from '@tanstack/react-router'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Phone,
  Plus,
  UserRound,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  addAppointment,
  cancelAppointment,
  formatDuration,
  getOpenSlots,
  getOwnerDays,
  initials,
  listForDay,
  mergeServices,
  shortHoldCode,
  toISODate,
  type Appointment,
  type DayOption,
} from '../lib/calendar-store'
import { DEMO_STYLISTS, loadSalonContext } from '../lib/demo-salon'
import { pullFromCloud } from '../lib/cloud-sync'
import { markPaid, markWaived, requestDeposit } from '../lib/payments'

export const Route = createFileRoute('/dashboard/calendar')({
  component: CalendarPage,
})

function CalendarPage() {
  const days = useMemo(() => getOwnerDays(14), [])
  const todayISO = toISODate(new Date())
  const [selectedISO, setSelectedISO] = useState(todayISO)
  const [appts, setAppts] = useState<Appointment[]>([])
  const [toast, setToast] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const salon = useMemo(() => loadSalonContext(), [])
  const services = useMemo(() => mergeServices(salon.services), [salon])

  const selectedDay: DayOption = useMemo(() => {
    return (
      days.find((d) => d.dateISO === selectedISO) || {
        dateISO: selectedISO,
        dateLabel: selectedISO,
        weekday: '',
      }
    )
  }, [days, selectedISO])

  const refresh = useCallback(() => {
    setAppts(listForDay(selectedISO))
  }, [selectedISO])

  useEffect(() => {
    let cancelled = false
    const fromCloud = async () => {
      await pullFromCloud()
      if (!cancelled) refresh()
    }
    void fromCloud()
    const onFocus = () => refresh()
    window.addEventListener('focus', onFocus)
    const interval = window.setInterval(() => {
      void fromCloud()
    }, 30_000)
    return () => {
      cancelled = true
      window.removeEventListener('focus', onFocus)
      window.clearInterval(interval)
    }
  }, [refresh])

  function toastMsg(m: string) {
    setToast(m)
    window.setTimeout(() => setToast(''), 2800)
  }

  function shiftDay(delta: number) {
    const idx = days.findIndex((d) => d.dateISO === selectedISO)
    const next = days[Math.max(0, Math.min(days.length - 1, (idx < 0 ? 0 : idx) + delta))]
    if (next) setSelectedISO(next.dateISO)
  }

  function onCancel(id: string, name: string) {
    cancelAppointment(id)
    refresh()
    toastMsg(`Cancelled ${name} — chair freed.`)
  }

  const openSlots = getOpenSlots(selectedISO, services[0] || 'Cut & style')
  const bookedMin = appts.filter((a) => a.status === 'confirmed').reduce((s, a) => s + a.durationMin, 0)

  return (
    <>
      {toast && (
        <div className="toast">
          <span className="toast-check">✓</span>
          {toast}
        </div>
      )}

      <div className="welcome-row">
        <div>
          <p>CALENDAR SPINE</p>
          <h1>Live book</h1>
          <span>
            Multi-stylist live book — Glo and owners share one calendar. Demo seeds a full floor; your real bookings
            replace it.
          </span>
        </div>
        <button type="button" className="button-dark cal-add-btn" onClick={() => setShowAdd((v) => !v)}>
          <Plus size={16} /> {showAdd ? 'Close' : 'Add appointment'}
        </button>
      </div>

      <div className="cal-day-picker">
        <button type="button" className="cal-nav-btn" onClick={() => shiftDay(-1)} aria-label="Previous day">
          <ChevronLeft size={18} />
        </button>
        <div className="cal-day-strip">
          {days.map((d) => {
            const count = listForDay(d.dateISO).length
            const active = d.dateISO === selectedISO
            const isToday = d.dateISO === todayISO
            return (
              <button
                type="button"
                key={d.dateISO}
                className={`cal-day-chip ${active ? 'active' : ''} ${isToday ? 'today' : ''}`}
                onClick={() => setSelectedISO(d.dateISO)}
              >
                <small>{d.weekday.slice(0, 3)}</small>
                <strong>{d.dateISO.slice(8)}</strong>
                {count > 0 && <i>{count}</i>}
              </button>
            )
          })}
        </div>
        <button type="button" className="cal-nav-btn" onClick={() => shiftDay(1)} aria-label="Next day">
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="cal-summary">
        <div>
          <CalendarDays size={16} />
          <strong>{selectedDay.dateLabel}</strong>
        </div>
        <div>
          <span>{appts.length} booked</span>
          <span>{formatDuration(bookedMin)} chair time</span>
          <span>{openSlots.length} open starts</span>
        </div>
      </div>

      {showAdd && (
        <AddAppointmentForm
          dateISO={selectedISO}
          dateLabel={selectedDay.dateLabel}
          services={services}
          onSaved={() => {
            setShowAdd(false)
            refresh()
            toastMsg('Appointment added to the book.')
          }}
          onError={(m) => toastMsg(m)}
        />
      )}

      <section className="schedule-card cal-day-card">
        <div className="card-heading">
          <div>
            <span>DAY VIEW</span>
            <h2>{selectedDay.weekday || 'Schedule'}</h2>
          </div>
          <Link to="/" className="cal-public-link">
            AI books from homepage →
          </Link>
        </div>

        {appts.length === 0 ? (
          <p className="booking-holds-empty">
            No appointments this day. Clients book via <strong>AI Receptionist</strong> on the public site, or use{' '}
            <strong>Add appointment</strong>.
          </p>
        ) : (
          <div className="appointment-list cal-appt-list">
            {appts.map((a) => (
              <article key={a.id} className={a.status === 'cancelled' ? 'cal-cancelled' : ''}>
                <div className="appointment-time">
                  <strong>{a.time.replace(/ (AM|PM)/, '')}</strong>
                  <span>{a.time.includes('PM') ? 'PM' : 'AM'}</span>
                </div>
                <div className="client-avatar rose">{initials(a.clientName)}</div>
                <div className="client-info">
                  <strong>{a.clientName}</strong>
                  <span>{a.service}</span>
                </div>
                <div className="appointment-meta">
                  <span>
                    <UserRound size={13} />
                    {a.stylist}
                  </span>
                  <span>
                    <Clock3 size={13} />
                    {formatDuration(a.durationMin)}
                  </span>
                  <span>
                    <Phone size={13} />
                    {a.clientPhone}
                  </span>
                </div>
                <div className="cal-appt-actions">
                  <small>
                    Ref {shortHoldCode(a.id)} · pay {a.paymentStatus || 'unpaid'}
                  </small>
                  {a.status === 'confirmed' && (
                    <>
                      <button
                        type="button"
                        className="button-dark button-small"
                        onClick={() => {
                          const r = requestDeposit(a)
                          toastMsg(
                            r.ok
                              ? 'Deposit requested · link opened · SMS via Twilio or outbox'
                              : r.error || 'Deposit failed',
                          )
                          refresh()
                        }}
                      >
                        Deposit
                      </button>
                      <button
                        type="button"
                        className="booking-hold-cancel"
                        onClick={() => {
                          markPaid(a.id)
                          refresh()
                          toastMsg('Marked paid.')
                        }}
                      >
                        Paid
                      </button>
                      <button
                        type="button"
                        className="booking-hold-cancel"
                        onClick={() => {
                          markWaived(a.id)
                          refresh()
                          toastMsg('Deposit waived.')
                        }}
                      >
                        Waive
                      </button>
                      <button type="button" className="booking-hold-cancel" onClick={() => onCancel(a.id, a.clientName)}>
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <p className="demo-data-banner">
        Multi-stylist calendar · multi-device cloud book · deposits + SMS confirms (Ops). Empty books seed a demo floor
        once; new books auto-message when messaging is on.
      </p>
    </>
  )
}

function AddAppointmentForm({
  dateISO,
  dateLabel,
  services,
  onSaved,
  onError,
}: {
  dateISO: string
  dateLabel: string
  services: string[]
  onSaved: () => void
  onError: (m: string) => void
}) {
  const [service, setService] = useState(services[0] || 'Cut & style')
  const [stylist, setStylist] = useState<string>(DEMO_STYLISTS[0])
  const slots = getOpenSlots(dateISO, service, undefined, stylist)
  const [time, setTime] = useState(slots[0] || '')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  useEffect(() => {
    const next = getOpenSlots(dateISO, service, undefined, stylist)
    setTime(next[0] || '')
  }, [service, dateISO, stylist])

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim() || phone.replace(/\D/g, '').length < 7) {
      onError('Need client name and a valid phone.')
      return
    }
    if (!time) {
      onError('No open slots for that stylist / service duration.')
      return
    }
    try {
      addAppointment({
        service,
        dateISO,
        dateLabel,
        time,
        clientName: name,
        clientPhone: phone,
        stylist,
        source: 'owner',
      })
      onSaved()
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Could not save.')
    }
  }

  return (
    <form className="cal-add-form" onSubmit={onSubmit}>
      <h3>Add for {dateLabel}</h3>
      <div className="cal-add-grid">
        <label>
          Stylist / chair
          <select value={stylist} onChange={(e) => setStylist(e.target.value)}>
            {DEMO_STYLISTS.filter((s) => s !== 'Front desk').map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label>
          Service
          <select value={service} onChange={(e) => setService(e.target.value)}>
            {services.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label>
          Time
          <select value={time} onChange={(e) => setTime(e.target.value)} required>
            {slots.length === 0 && <option value="">No openings</option>}
            {slots.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label>
          Client name
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Maya Chen" required />
        </label>
        <label>
          Phone
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(310) 555-0147" required />
        </label>
      </div>
      <button type="submit" className="button-dark" disabled={!time}>
        Save to book
      </button>
    </form>
  )
}
