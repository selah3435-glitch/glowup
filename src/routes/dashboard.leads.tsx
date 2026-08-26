import { createFileRoute, Link } from '@tanstack/react-router'
import { Phone, Sparkles, UserPlus } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import {
  leadCounts,
  listLeads,
  updateLeadStatus,
  type Lead,
  type LeadStatus,
} from '../lib/leads-store'

export const Route = createFileRoute('/dashboard/leads')({
  component: LeadsPage,
})

const STATUSES: LeadStatus[] = ['new', 'contacted', 'qualified', 'booked', 'lost']

function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [counts, setCounts] = useState({ total: 0, new: 0, qualified: 0, booked: 0 })
  const [toast, setToast] = useState('')

  const refresh = useCallback(() => {
    setLeads(listLeads())
    setCounts(leadCounts())
  }, [])

  useEffect(() => {
    refresh()
    const onFocus = () => refresh()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [refresh])

  function toastMsg(m: string) {
    setToast(m)
    window.setTimeout(() => setToast(''), 2400)
  }

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
          <p>PHASE 2 · GLO AI</p>
          <h1>Leads</h1>
          <span>
            Website chat captures leads with Glo. Phone voice coming soon ·{' '}
            <Link to="/">Open site chat</Link>
          </span>
        </div>
      </div>

      <div className="ss-kpi-row ss-kpi-wide" style={{ marginBottom: 20, maxWidth: 720 }}>
        <div className="crm-stats" style={{ display: 'contents' }}>
          <div style={{ padding: 14, borderRadius: 12, background: 'var(--card)', border: '1px solid rgba(255,255,255,.08)' }}>
            <strong style={{ fontFamily: 'var(--serif)', fontSize: 22 }}>{counts.new}</strong>
            <span style={{ display: 'block', color: 'var(--muted)', fontSize: 11 }}>NEW</span>
          </div>
          <div style={{ padding: 14, borderRadius: 12, background: 'var(--card)', border: '1px solid rgba(255,255,255,.08)' }}>
            <strong style={{ fontFamily: 'var(--serif)', fontSize: 22 }}>{counts.qualified}</strong>
            <span style={{ display: 'block', color: 'var(--muted)', fontSize: 11 }}>QUALIFIED</span>
          </div>
          <div style={{ padding: 14, borderRadius: 12, background: 'var(--card)', border: '1px solid rgba(255,255,255,.08)' }}>
            <strong style={{ fontFamily: 'var(--serif)', fontSize: 22 }}>{counts.booked}</strong>
            <span style={{ display: 'block', color: 'var(--muted)', fontSize: 11 }}>BOOKED</span>
          </div>
          <div style={{ padding: 14, borderRadius: 12, background: 'var(--card)', border: '1px solid rgba(255,255,255,.08)' }}>
            <strong style={{ fontFamily: 'var(--serif)', fontSize: 22 }}>{counts.total}</strong>
            <span style={{ display: 'block', color: 'var(--muted)', fontSize: 11 }}>TOTAL</span>
          </div>
        </div>
      </div>

      <section className="schedule-card">
        <div className="card-heading">
          <div>
            <span>
              <Sparkles size={14} /> GLO WEBSITE CHAT
            </span>
            <h2>Captured leads</h2>
          </div>
        </div>

        {leads.length === 0 ? (
          <p className="booking-holds-empty">
            No leads yet. On the public site, open <strong>Glo</strong> chat and tap <strong>Get info / lead</strong> — or
            have a visitor leave their number after pricing questions.
          </p>
        ) : (
          <ul className="booking-holds-list">
            {leads.map((l) => (
              <li key={l.id}>
                <div className="booking-hold-main">
                  <strong>
                    <UserPlus size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
                    {l.name || 'Unknown'}
                  </strong>
                  <span>
                    {l.serviceInterest || l.interest || 'General interest'} · {l.fit} · via {l.source.replace('_', ' ')}
                  </span>
                  <small>
                    {new Date(l.createdAt).toLocaleString()} · Glo {l.assignedGloRole.replace('glo_', '')}
                    {l.notes ? ` · ${l.notes.slice(0, 80)}` : ''}
                  </small>
                </div>
                <a className="booking-hold-phone" href={`tel:${l.phone}`}>
                  <Phone size={13} />
                  {l.phone}
                </a>
                <select
                  value={l.status}
                  onChange={(e) => {
                    updateLeadStatus(l.id, e.target.value as LeadStatus)
                    refresh()
                    toastMsg(`Lead → ${e.target.value}`)
                  }}
                  style={{
                    background: '#0e0c0d',
                    color: 'inherit',
                    border: '1px solid rgba(255,255,255,.12)',
                    borderRadius: 8,
                    padding: '6px 8px',
                    fontSize: 12,
                  }}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
