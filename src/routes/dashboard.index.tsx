import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ArrowUpRight,
  CalendarDays,
  ChevronRight,
  Clock3,
  Copy,
  Heart,
  MoreHorizontal,
  Package,
  Phone,
  Sparkles,
  UserRound,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { salonDeskUrl } from '../lib/cloud-sync'
import {
  cancelAppointment,
  formatDuration,
  initials,
  listAppointments,
  listForDay,
  listUpcoming,
  shortHoldCode,
  toISODate,
  totalBookedMinutes,
  type Appointment,
} from '../lib/calendar-store'
import { PRICING_PLANS, type PlanId } from '../lib/pricing'
import { loadPilotSession } from '../lib/pilot-session'
import { loadSalonContext } from '../lib/demo-salon'
import { ensureDeskKey, ensureSalonSyncKey } from '../lib/ops-settings'
import { computeProofMetrics } from '../lib/proof-metrics'
import { listPendingDrafts } from '../lib/draft-store'

export const Route = createFileRoute('/dashboard/')({
  component: DashboardOverview,
})

function mondayOf(d: Date): Date {
  const x = new Date(d)
  const day = x.getDay()
  const diff = day === 0 ? -6 : 1 - day
  x.setDate(x.getDate() + diff)
  x.setHours(12, 0, 0, 0)
  return x
}

function thisWeekBook(todayISO: string): { counts: number[]; total: number; glo: number } {
  const today = new Date(`${todayISO}T12:00:00`)
  const mon = mondayOf(today)
  const isos: string[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(mon)
    d.setDate(mon.getDate() + i)
    isos.push(toISODate(d))
  }
  const appts = listAppointments().filter((a) => a.status === 'confirmed' || a.status === 'completed')
  const week = appts.filter((a) => isos.includes(a.dateISO))
  return {
    counts: isos.map((iso) => week.filter((a) => a.dateISO === iso).length),
    total: week.length,
    glo: week.filter((a) => a.source === 'ai_receptionist').length,
  }
}

function DashboardOverview() {
  const [toast, setToast] = useState('')
  const [upcoming, setUpcoming] = useState<Appointment[]>([])
  const [todayAppts, setTodayAppts] = useState<Appointment[]>([])
  const todayISO = toISODate(new Date())

  const refresh = useCallback(() => {
    setUpcoming(listUpcoming(8))
    setTodayAppts(listForDay(todayISO))
  }, [todayISO])

  useEffect(() => {
    refresh()
    const onFocus = () => refresh()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [refresh])

  function quickAction(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(''), 2600)
  }

  function onCancelAppt(id: string, name: string) {
    cancelAppointment(id)
    refresh()
    quickAction(`Released booking for ${name}.`)
  }

  const todayCount = todayAppts.length
  const todayMins = totalBookedMinutes(todayISO)
  const proof = typeof window !== 'undefined' ? computeProofMetrics() : null
  const pendingDrafts = typeof window !== 'undefined' ? listPendingDrafts().length : 0
  const returningLabel =
    proof && proof.returningPct != null ? `${proof.returningPct}%` : '—'
  const week =
    typeof window !== 'undefined'
      ? thisWeekBook(todayISO)
      : { counts: [0, 0, 0, 0, 0, 0, 0], total: 0, glo: 0 }
  const weekMax = Math.max(1, ...week.counts)
  const planId =
    (typeof window !== 'undefined' && (window.localStorage.getItem('glowup_selected_plan_v1') as PlanId)) ||
    'floor'
  const plan = PRICING_PLANS.find((p) => p.id === planId) || PRICING_PLANS[1]
  const pilot = typeof window !== 'undefined' ? loadPilotSession() : null
  const salon = typeof window !== 'undefined' ? loadSalonContext() : null
  const firstName = (pilot?.name || salon?.name || 'Owner').split(' ')[0]
  const deskUrl = typeof window !== 'undefined' ? salonDeskUrl(ensureDeskKey()) : ''

  return (
    <>
      {toast && (
        <div className="toast">
          <span className="toast-check">✓</span>
          {toast}
        </div>
      )}

      <div
        className="schedule-card"
        style={{ marginBottom: '1rem', padding: '16px 18px', border: '1px solid rgba(196,165,116,0.35)' }}
      >
        <strong style={{ display: 'block', marginBottom: 6 }}>Your Glo front desk</strong>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
          <input
            readOnly
            value={deskUrl}
            onFocus={(e) => e.currentTarget.select()}
            spellCheck={false}
            style={{
              flex: 1,
              minWidth: 220,
              height: 36,
              padding: '0 10px',
              border: '1px solid var(--line)',
              borderRadius: 2,
              background: 'var(--card)',
              color: 'var(--ink)',
              fontSize: 12,
            }}
          />
          <button
            type="button"
            className="button-dark button-small"
            onClick={() => {
              if (!deskUrl) return
              void navigator.clipboard.writeText(deskUrl).then(() => quickAction('Glo desk link copied.'))
            }}
          >
            <Copy size={13} /> Copy
          </button>
        </div>
        <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.55, opacity: 0.9 }}>
          <li>Share that link — a guest books with Glo 24/7</li>
          <li>
            <strong>Calendar</strong> shows it after refresh/pull
          </li>
          <li>
            Optional: <strong>Ops</strong> → add Stripe deposit link + send a reminder
          </li>
          <li>
            Optional: <strong>Platform</strong> (owner) to see signups
          </li>
        </ol>
      </div>

      <div className="welcome-row">
        <div>
          <p>OWNER HOME · {plan.name.toUpperCase()} PLAN</p>
          <h1>Welcome{firstName ? `, ${firstName}` : ''}.</h1>
          <span>
            {salon?.name || 'Your studio'} is ready · {plan.priceLabel}/mo · Glo + calendar + CRM online. Share your
            booking link and run the checklist above.
          </span>
        </div>
        <div className="weather-note">
          <i>✦</i>
          <div>
            <strong>Glow Agents online</strong>
            <small>
              {pendingDrafts > 0
                ? `${pendingDrafts} draft${pendingDrafts === 1 ? '' : 's'} waiting approval`
                : 'No drafts waiting'}
            </small>
          </div>
        </div>
      </div>

      <div className="metric-grid">
        <article>
          <div>
            <span>Today’s book</span>
            <CalendarDays size={18} />
          </div>
          <strong>
            {todayCount} <small>live</small>
          </strong>
          {todayCount === 0 ? (
            <p>No visits yet — share your Glo link.</p>
          ) : (
            <p className="positive">
              <ArrowUpRight size={14} />
              {formatDuration(todayMins)} <span>booked</span>
            </p>
          )}
          <div className="capacity">
            {Array.from({ length: Math.min(14, Math.max(todayCount, 1)) }).map((_, i) => (
              <i key={i} className={i >= todayCount ? 'empty' : undefined} />
            ))}
          </div>
        </article>
        <article>
          <div>
            <span>Clients returning</span>
            <Heart size={18} />
          </div>
          <strong>{returningLabel}</strong>
          <p>
            {proof && proof.returningPct != null
              ? `${proof.returningGuestCount} of ${proof.guestCount} guests`
              : 'Need 2+ guests on the book'}
          </p>
        </article>
        <article>
          <div>
            <span>Glo books</span>
            <Sparkles size={18} />
          </div>
          <strong>
            {proof ? proof.totalAiBooks : 0} <small>live</small>
          </strong>
          <p>
            {proof && proof.afterHoursAiBooks
              ? `${proof.afterHoursAiBooks} after hours`
              : 'From Glo chat on this book'}
          </p>
        </article>
        <article>
          <div>
            <span>Leads</span>
            <UserRound size={18} />
          </div>
          <strong>
            {proof ? proof.leadsCaptured : 0} <small>live</small>
          </strong>
          <p>
            {proof && proof.leadsBooked
              ? `${proof.leadsBooked} booked`
              : 'From Glo and the desk'}
          </p>
        </article>
      </div>

      <section className="booking-holds-card">
        <div className="card-heading">
          <div>
            <span>UPCOMING · LIVE</span>
            <h2>Bookings</h2>
          </div>
          <Link to="/dashboard/calendar">
            Open calendar <ChevronRight size={15} />
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <p className="booking-holds-empty">
            No upcoming bookings — clients use <strong>AI Receptionist</strong> on the public site, or add from Calendar.
          </p>
        ) : (
          <ul className="booking-holds-list">
            {upcoming.map((h) => (
              <li key={h.id}>
                <div className="booking-hold-main">
                  <strong>{h.clientName}</strong>
                  <span>{h.service}</span>
                  <small>
                    {h.dateLabel} · {h.time} · {formatDuration(h.durationMin)} · Ref {shortHoldCode(h.id)}
                  </small>
                </div>
                <a className="booking-hold-phone" href={`tel:${h.clientPhone}`}>
                  <Phone size={13} />
                  {h.clientPhone}
                </a>
                <button type="button" className="booking-hold-cancel" onClick={() => onCancelAppt(h.id, h.clientName)}>
                  Cancel
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="dashboard-columns">
        <section className="schedule-card">
          <div className="card-heading">
            <div>
              <span>TODAY’S FLOW · LIVE</span>
              <h2>Today’s appointments</h2>
            </div>
            <Link to="/dashboard/calendar">
              View calendar <ChevronRight size={15} />
            </Link>
          </div>
          <div className="schedule-summary">
            <div>
              <strong>{todayCount}</strong>
              <span>appointments</span>
            </div>
            <div>
              <strong>{formatDuration(todayMins)}</strong>
              <span>booked time</span>
            </div>
            <div>
              <strong>—</strong>
              <span>revenue later</span>
            </div>
          </div>
          <div className="appointment-list">
            {todayAppts.length === 0 ? (
              <p className="booking-holds-empty" style={{ padding: '12px 0' }}>
                Nothing on today’s book yet.
              </p>
            ) : (
              todayAppts.map((appointment) => {
                const parts = appointment.time.split(' ')
                return (
                  <article key={appointment.id}>
                    <div className="appointment-time">
                      <strong>{parts[0]}</strong>
                      <span>{parts[1] || ''}</span>
                    </div>
                    <div className="client-avatar rose">{initials(appointment.clientName)}</div>
                    <div className="client-info">
                      <strong>{appointment.clientName}</strong>
                      <span>{appointment.service}</span>
                    </div>
                    <div className="appointment-meta">
                      <span>
                        <UserRound size={13} />
                        {appointment.stylist}
                      </span>
                      <span>
                        <Clock3 size={13} />
                        {formatDuration(appointment.durationMin)}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="booking-hold-cancel"
                      onClick={() => onCancelAppt(appointment.id, appointment.clientName)}
                    >
                      Cancel
                    </button>
                  </article>
                )
              })
            )}
          </div>
          <Link to="/dashboard/calendar" className="schedule-footer">
            Open full calendar <ArrowUpRight size={15} />
          </Link>
        </section>

        <aside className="insights-column">
          <section className="rebook-card">
            <div className="insight-icon">
              <Sparkles size={18} />
            </div>
            <span>GLOW CONCIERGE</span>
            <h3>
              {pendingDrafts > 0
                ? `${pendingDrafts} draft${pendingDrafts === 1 ? '' : 's'} waiting approval.`
                : 'No drafts waiting.'}
            </h3>
            <p>Stylists draft. You approve. Assist publish for Facebook & Instagram first.</p>
            <Link to="/dashboard/concierge" className="rebook-link-button">
              Open Concierge <ArrowUpRight size={15} />
            </Link>
          </section>
          <section className="week-card">
            <div className="card-heading">
              <div>
                <span>THIS WEEK</span>
                <h3>Book rhythm</h3>
              </div>
              <button type="button">
                <MoreHorizontal size={18} />
              </button>
            </div>
            <div className="revenue-total">
              <strong>
                {week.total} <small>visits</small>
              </strong>
              <span>{week.total === 0 ? 'No visits yet' : 'On this book'}</span>
            </div>
            <div className="week-chart">
              {week.counts.map((count, index) => (
                <div key={index}>
                  <i
                    style={{ height: `${Math.round((count / weekMax) * 100)}%` }}
                    className={count === Math.max(...week.counts) && count > 0 ? 'highlight' : ''}
                  />
                  <span>{['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]}</span>
                </div>
              ))}
            </div>
            <div className="week-footer">
              <span>
                <i />
                Glo <b>{week.glo}</b>
              </span>
              <span>
                <i />
                Other <b>{Math.max(0, week.total - week.glo)}</b>
              </span>
            </div>
          </section>
          {pendingDrafts > 0 ? (
            <section className="inventory-alert">
              <Package size={18} />
              <div>
                <strong>
                  {pendingDrafts} draft{pendingDrafts === 1 ? '' : 's'} waiting approval
                </strong>
              </div>
              <Link to="/dashboard/social">
                <ChevronRight size={17} />
              </Link>
            </section>
          ) : null}
        </aside>
      </div>

      <p className="demo-data-banner">
        Figures on this page come from this studio’s book and leads. No modeled revenue.
        Cloud pull: Dashboard → Ops.
      </p>
    </>
  )
}
