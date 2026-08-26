import { createFileRoute } from '@tanstack/react-router'
import { RefreshCw, Users } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { listPlatformSignups, type PlatformSignup } from '../lib/platform-client'
import {
  addCompanyLead,
  exportCompanyAudienceCsv,
  exportCompanyLeadsBackupJson,
  formatCompanyLeadExtra,
  importCompanyLeadsBackup,
  listCompanyScoutRows,
  listManualCompanyLeads,
  type CompanyScoutRow,
} from '../lib/company-leads'
import { generateCopyPack } from '../lib/copywriter-client'
import { getAgent } from '../lib/glow-agents'
import type { CopyPack } from '../agents/copywriter'
import { COMPANY_ICP_GUIDE, COMPANY_ICP_LINE } from '../lib/company-icp'
import { findSalonProspects } from '../lib/company-prospect-client'
import type { DiscoveredSalon } from '../lib/company-prospect'

export const Route = createFileRoute('/dashboard/platform')({
  component: PlatformPage,
})

function PlatformPage() {
  const [items, setItems] = useState<PlatformSignup[]>([])
  const [stages, setStages] = useState<Record<string, number>>({})
  const [count, setCount] = useState(0)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(() => {
    if (typeof window === 'undefined') return ''
    return window.localStorage.getItem('glowup_platform_admin_token') || ''
  })

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const res = await listPlatformSignups(token || undefined)
    setLoading(false)
    if (!res.ok) {
      setError(res.error || 'Could not load signups')
      refreshScout([])
      return
    }
    setItems(res.items || [])
    setStages(res.stages || {})
    setCount(res.count || 0)
    refreshScout(res.items || [])
  }, [token])

  useEffect(() => {
    void load()
  }, [load])

  const [scoutRows, setScoutRows] = useState<CompanyScoutRow[]>([])
  const [form, setForm] = useState({
    salonName: '',
    ownerName: '',
    email: '',
    phone: '',
    city: '',
    website: '',
    chairs: '',
    notes: '',
  })
  const [scoutBusy, setScoutBusy] = useState<string | null>(null)
  const [scoutNote, setScoutNote] = useState('')
  const [pack, setPack] = useState<CopyPack | null>(null)
  const [huntCity, setHuntCity] = useState('Los Angeles')
  const [hunting, setHunting] = useState(false)
  const [found, setFound] = useState<DiscoveredSalon[]>([])
  const [socialFound, setSocialFound] = useState<DiscoveredSalon[]>([])
  const [huntMeta, setHuntMeta] = useState('')
  const [addedKeys, setAddedKeys] = useState<string[]>([])
  const [toast, setToast] = useState('')

  function flash(message: string) {
    setToast(message)
    setScoutNote(message)
    window.setTimeout(() => setToast(''), 4000)
  }

  function hitKey(hit: DiscoveredSalon) {
    return (hit.url || hit.phone || hit.title).toLowerCase()
  }

  function refreshScout(signups: PlatformSignup[]) {
    setScoutRows(listCompanyScoutRows(signups))
  }

  async function draftCompany(row: CompanyScoutRow) {
    setScoutBusy(row.id)
    setScoutNote(`Writing GlowUP outreach for ${row.salonName || row.email}…`)
    const result = await generateCopyPack({
      salonName: 'GlowUP.',
      city: row.city || 'your city',
      brandTone: 'Clear, operator-to-operator',
      service: 'GlowUP salon OS + Glo',
      campaign: 'company_lead',
      extra: formatCompanyLeadExtra(row),
    })
    setPack(result.pack)
    setScoutBusy(null)
    setScoutNote(
      result.fallback
        ? `Offline pack${result.error ? ` (${result.error})` : ''}.`
        : `${row.band} · ${row.points} fact-points. This is B2B copy for you — not a guest text.`,
    )
  }

  async function huntSalons() {
    setHunting(true)
    setHuntMeta('Searching public web for salons…')
    const res = await findSalonProspects(huntCity)
    setFound(res.items)
    setSocialFound(res.socialItems || [])
    setHunting(false)
    setHuntMeta(
      res.error
        ? res.error
        : `${res.items.length} Google listings (${res.provider}). ${res.socialNote || ''}`.trim(),
    )
  }

  function addDiscovered(hit: DiscoveredSalon) {
    const key = hitKey(hit)
    if (addedKeys.includes(key)) {
      flash(`${hit.title.slice(0, 50)} is already on your list.`)
      return
    }
    try {
      const emailMatch = `${hit.snippet} ${hit.signals.join(' ')}`.match(
        /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
      )
      addCompanyLead({
        salonName: hit.title.replace(/\s*[|\-–].*$/, '').slice(0, 80),
        ownerName: hit.handle || '',
        email: emailMatch?.[0] || '',
        phone: hit.phone || '',
        city: hit.city,
        website: hit.url,
        chairs: '',
        notes: [hit.snippet, ...hit.signals].filter(Boolean).join(' · '),
        source: 'import',
        stage: 'prospect',
      })
      setAddedKeys((prev) => [...prev, key])
      refreshScout(items)
      flash(`Added to your list: ${hit.title.slice(0, 70)}`)
    } catch (e) {
      flash(e instanceof Error ? e.message : 'Could not add that lead.')
    }
  }

  function downloadAudienceCsv() {
    if (!scoutRows.length) {
      setScoutNote('Add or hunt leads first, then export.')
      return
    }
    const csv = exportCompanyAudienceCsv(scoutRows)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `glowup-lookalike-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    flash(
      `Saved to your Downloads folder: glowup-lookalike-${new Date().toISOString().slice(0, 10)}.csv`,
    )
  }

  function downloadLeadsBackup() {
    const manual = listManualCompanyLeads()
    if (!manual.length && !scoutRows.length) {
      flash('Nothing to save yet. Hunt or add a salon first.')
      return
    }
    const json = exportCompanyLeadsBackupJson(manual)
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `glowup-company-leads-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    flash(
      `Backup saved to Downloads: glowup-company-leads-${new Date().toISOString().slice(0, 10)}.json — reopen it here with Import backup.`,
    )
  }

  function importLeadsFile(file: File) {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const result = importCompanyLeadsBackup(String(reader.result || ''))
        refreshScout(items)
        flash(`Imported ${result.added} lead${result.added === 1 ? '' : 's'} · skipped ${result.skipped} · list now ${result.total}.`)
      } catch (e) {
        flash(e instanceof Error ? e.message : 'Could not read that backup file.')
      }
    }
    reader.readAsText(file)
  }

  function saveToken(t: string) {
    setToken(t)
    if (typeof window !== 'undefined') {
      if (t) window.localStorage.setItem('glowup_platform_admin_token', t)
      else window.localStorage.removeItem('glowup_platform_admin_token')
    }
  }

  return (
    <>
      {toast && (
        <div className="toast" role="status">
          <span className="toast-check">✓</span>
          {toast}
        </div>
      )}
      <div className="welcome-row">
        <div>
          <p>PLATFORM OPS</p>
          <h1>Signups</h1>
          <span>Who joined GlowUP. — stages from account create through onboarding complete.</span>
        </div>
        <button type="button" className="button-dark" onClick={() => void load()} disabled={loading}>
          <RefreshCw size={16} /> {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      <div className="metric-grid" style={{ marginBottom: '1.25rem' }}>
        <article>
          <div>
            <span>Total</span>
            <Users size={18} />
          </div>
          <strong>{count}</strong>
          <p className="muted-copy">Tracked accounts</p>
        </article>
        <article>
          <div>
            <span>Signed up</span>
          </div>
          <strong>{stages.signed_up ?? 0}</strong>
        </article>
        <article>
          <div>
            <span>Onboarding</span>
          </div>
          <strong>{(stages.onboarding_started ?? 0) + (stages.onboarding_complete ?? 0)}</strong>
        </article>
        <article>
          <div>
            <span>Complete / active</span>
          </div>
          <strong>{(stages.onboarding_complete ?? 0) + (stages.active ?? 0)}</strong>
        </article>
      </div>

      <label className="full" style={{ display: 'block', marginBottom: '1rem', maxWidth: 420 }}>
        Admin token (if PLATFORM_ADMIN_TOKEN is set on Netlify)
        <input
          type="password"
          value={token}
          onChange={(e) => saveToken(e.target.value)}
          placeholder="Optional — leave blank if token not set"
          style={{ width: '100%', marginTop: 6 }}
        />
      </label>

      {error && (
        <p className="muted-copy" role="alert">
          {error}
        </p>
      )}

      <section className="schedule-card">
        <div className="card-heading">
          <div>
            <span>REGISTRY</span>
            <h2>All signups</h2>
          </div>
        </div>
        {items.length === 0 && !loading ? (
          <p className="booking-holds-empty">
            No signups tracked yet. New accounts from <strong>Create account</strong> appear here automatically.
          </p>
        ) : (
          <div className="appointment-list">
            {items.map((s) => (
              <article key={s.id}>
                <div className="client-info">
                  <strong>{s.name || '—'}</strong>
                  <span>{s.email}</span>
                </div>
                <div className="appointment-meta">
                  <span className="agent-chip">{s.stage.replace(/_/g, ' ')}</span>
                  <span>{new Date(s.createdAt).toLocaleString()}</span>
                  {s.meta && typeof s.meta === 'object' && 'salonName' in s.meta && (
                    <span>{String((s.meta as { salonName?: string }).salonName)}</span>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="scan-card" style={{ marginTop: '1.5rem' }}>
        <span className="agent-chip">{getAgent('company_lead_scout')?.name}</span>
        <h3>Company Lead Scout — sell GlowUP</h3>
        <p className="muted-copy">
          Different list from salon-guest Lead Scout. Every hunt runs Google (Serper + ScrapingBee)
          plus Apify on GlowUP IG/TikTok and salon-owner hashtags. {COMPANY_ICP_LINE} Public data only — no auto-DM,
          no invented emails, occupancy, or budget.
        </p>
        <details className="icp-guide">
          <summary>Ideal salon we score for</summary>
          <div className="icp-grid">
            {COMPANY_ICP_GUIDE.map((block) => (
              <div key={block.category}>
                <strong>{block.title}</strong>
                <ul>
                  {block.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="muted-copy">
            Hunt queries now include hiring, new ownership, call-to-book, booth rental, and color bars.
            Points only fire when the listing or your notes actually say it.
          </p>
        </details>
        <p className="muted-copy">
          Leads stay in <strong>this browser</strong> (not a folder on disk) until you download them.
          Use <strong>Download backup (JSON)</strong> to keep a file in your Downloads folder you can
          reopen later with Import backup. CSV is only for Meta lookalikes.
        </p>

        <div className="recipe-actions" style={{ margin: '12px 0' }}>
          <label className="field-label" style={{ flex: 1, minWidth: 180 }}>
            City to search
            <input value={huntCity} onChange={(e) => setHuntCity(e.target.value)} />
          </label>
          <button
            type="button"
            className="button button-dark button-small"
            disabled={hunting}
            onClick={() => void huntSalons()}
          >
            {hunting ? 'Hunting Google + Apify…' : 'Find salon owners'}
          </button>
          <button type="button" className="button button-cream button-small" onClick={downloadLeadsBackup}>
            Download backup (JSON)
          </button>
          <button type="button" className="button button-cream button-small" onClick={downloadAudienceCsv}>
            Export CSV for Meta lookalikes
          </button>
          <label className="button button-cream button-small" style={{ cursor: 'pointer' }}>
            Import backup
            <input
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0]
                e.target.value = ''
                if (file) importLeadsFile(file)
              }}
            />
          </label>
        </div>
        {huntMeta && <p className="muted-copy">{huntMeta}</p>}
        {found.length > 0 && (
          <ul className="review-visit-list">
            {found.map((hit) => (
              <li key={hit.url + (hit.phone || '')}>
                <span>
                  <strong>{hit.title}</strong> · {hit.band} · {hit.points} pts · {hit.source}
                  <br />
                  {hit.signals.join(' · ')}
                  {hit.address ? ` · ${hit.address}` : ''}
                  {hit.phone ? ` · ${hit.phone}` : ''}
                  <br />
                  <a href={hit.url} target="_blank" rel="noreferrer">
                    {hit.url}
                  </a>
                </span>
                <button
                  type="button"
                  className="button button-cream button-small"
                  disabled={addedKeys.includes(hitKey(hit))}
                  onClick={() => addDiscovered(hit)}
                >
                  {addedKeys.includes(hitKey(hit)) ? 'Added' : 'Add to list'}
                </button>
              </li>
            ))}
          </ul>
        )}
        {socialFound.length > 0 && (
          <>
            <p className="muted-copy" style={{ marginTop: 16 }}>
              Commenters on your Instagram
            </p>
            <ul className="review-visit-list">
              {socialFound.map((hit) => (
                <li key={hit.url}>
                  <span>
                    <strong>{hit.title}</strong> · {hit.band} · {hit.points} pts
                    <br />
                    {hit.snippet}
                  </span>
                  <button
                    type="button"
                    className="button button-cream button-small"
                    disabled={addedKeys.includes(hitKey(hit))}
                    onClick={() => addDiscovered(hit)}
                  >
                    {addedKeys.includes(hitKey(hit)) ? 'Added' : 'Add to list'}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}

        <form
          className="brand-form"
          style={{ marginTop: 12 }}
          onSubmit={(e) => {
            e.preventDefault()
            addCompanyLead(form)
            setForm({
              salonName: '',
              ownerName: '',
              email: '',
              phone: '',
              city: '',
              website: '',
              chairs: '',
              notes: '',
            })
            refreshScout(items)
            flash('Prospect saved to your list.')
          }}
        >
          <p className="muted-copy">Add a salon you want to sell to</p>
          <label className="field-label">
            Salon name
            <input
              value={form.salonName}
              onChange={(e) => setForm({ ...form, salonName: e.target.value })}
              required
            />
          </label>
          <label className="field-label">
            Owner
            <input value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} />
          </label>
          <label className="field-label">
            Email
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </label>
          <label className="field-label">
            City
            <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </label>
          <label className="field-label">
            Chairs (if you know)
            <input value={form.chairs} onChange={(e) => setForm({ ...form, chairs: e.target.value })} />
          </label>
          <label className="field-label">
            Notes
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="e.g. no online book, Instagram only"
            />
          </label>
          <button type="submit" className="button button-cream button-small">
            Add prospect
          </button>
        </form>

        <h4 style={{ margin: '20px 0 8px', fontFamily: 'var(--serif)', fontWeight: 400 }}>
          Your list · {scoutRows.length}
        </h4>
        {scoutNote && (
          <p className="muted-copy" role="status">
            {scoutNote}
          </p>
        )}
        {scoutRows.length === 0 ? (
          <p className="muted-copy">No company prospects yet. Hunt or add a salon below.</p>
        ) : (
          <ul className="review-visit-list" id="company-lead-list">
            {scoutRows.slice(0, 40).map((row) => (
              <li key={row.id}>
                <span>
                  <strong>{row.salonName || row.email || 'Unnamed salon'}</strong> · {row.band} ·{' '}
                  {row.points} pts
                  <br />
                  {row.reasons.slice(0, 3).join(' · ')}
                </span>
                <button
                  type="button"
                  className="button button-dark button-small"
                  disabled={scoutBusy === row.id}
                  onClick={() => void draftCompany(row)}
                >
                  {scoutBusy === row.id ? 'Writing…' : 'Draft outreach'}
                </button>
              </li>
            ))}
          </ul>
        )}
        {pack && (
          <div className="copy-pack-preview">
            <p>
              <strong>Subject</strong> {pack.email.subject}
            </p>
            <p>
              <strong>Email</strong> {pack.email.body}
            </p>
            <p>
              <strong>SMS</strong> {pack.sms}
            </p>
          </div>
        )}
      </section>

      <p className="demo-data-banner">
        Uptime: ping <code>/api/health</code> every minute. Alerts: set <code>OPS_ALERT_WEBHOOK</code> for email/SMS.
        See <code>docs/PLATFORM_OPS.md</code>.
      </p>
    </>
  )
}
