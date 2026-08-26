import { createFileRoute } from '@tanstack/react-router'
import {
  Bell,
  Cloud,
  CreditCard,
  Download,
  RefreshCw,
  Upload,
} from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import {
  exportSnapshotFile,
  importSnapshotFile,
  probeOpsApi,
  pullFromCloud,
  pushToCloud,
  salonDeskUrl,
} from '../lib/cloud-sync'
import {
  copyMessageBody,
  dispatchMessage,
  listMessages,
  queueMessage,
  sendRemindersForTomorrow,
  type OutboundMessage,
} from '../lib/notifications-store'
import { getGloUsageSnapshot } from '../lib/glo-usage'
import { computeProofMetrics } from '../lib/proof-metrics'
import { getPlan, getSelectedPlanId } from '../lib/pricing'
import { brandMailto, startCheckout } from '../lib/billing-client'
import { listUpcoming } from '../lib/calendar-store'
import {
  ensureSalonSyncKey,
  loadOpsSettings,
  regenerateSalonSyncKey,
  saveOpsSettings,
  type OpsSettings,
} from '../lib/ops-settings'

export const Route = createFileRoute('/dashboard/ops')({
  component: OpsPage,
})

function OpsPage() {
  const [settings, setSettings] = useState<OpsSettings>(() => loadOpsSettings())
  const [messages, setMessages] = useState<OutboundMessage[]>([])
  const [toast, setToast] = useState('')
  const [syncKey, setSyncKey] = useState('')
  const [cloudStatus, setCloudStatus] = useState('Checking cloud…')
  const [msgStatus, setMsgStatus] = useState('Checking SMS/email…')

  const refresh = useCallback(() => {
    setSettings(loadOpsSettings())
    setMessages(listMessages(40))
    setSyncKey(ensureSalonSyncKey())
  }, [])

  useEffect(() => {
    refresh()
    void probeOpsApi().then((r) => {
      setCloudStatus(r.ok ? `✓ ${r.detail}` : `✗ ${r.detail}`)
    })
    void fetch('/api/health', { cache: 'no-store' })
      .then((r) => r.json())
      .then((h: { hasTwilio?: boolean; hasResend?: boolean }) => {
        const tw = h.hasTwilio ? 'Twilio live' : 'Twilio not set (native/outbox)'
        const rs = h.hasResend ? 'Resend live' : 'Resend not set (mailto/outbox)'
        setMsgStatus(`${tw} · ${rs}`)
      })
      .catch(() => setMsgStatus('Could not read /api/health'))
  }, [refresh])

  function toastMsg(m: string) {
    setToast(m)
    window.setTimeout(() => setToast(''), 3200)
  }

  function saveField(patch: Partial<OpsSettings>) {
    setSettings(saveOpsSettings(patch))
    toastMsg('Saved.')
  }

  async function onPush() {
    saveOpsSettings({ syncEnabled: true, salonSyncKey: syncKey || ensureSalonSyncKey() })
    const r = await pushToCloud()
    if (r.ok) toastMsg(`Cloud book saved · ${r.updatedAt}`)
    else toastMsg(r.error)
    refresh()
  }

  async function onPull() {
    const key = syncKey || ensureSalonSyncKey()
    saveOpsSettings({ syncEnabled: true, salonSyncKey: key })
    const r = await pullFromCloud(key)
    if (r.ok) {
      toastMsg(`Cloud book loaded · ${r.updatedAt}`)
      window.location.reload()
      return
    }
    // First device: nothing in cloud yet — push this device instead of scary "not deployed"
    if (!r.needsApi && /no cloud book|empty cloud|push from primary/i.test(r.error)) {
      const p = await pushToCloud()
      if (p.ok) {
        toastMsg(`First save complete · cloud book created · ${p.updatedAt}`)
        refresh()
        return
      }
      toastMsg(p.error)
      refresh()
      return
    }
    toastMsg(r.error)
  }

  function onExport() {
    exportSnapshotFile()
    toastMsg('Snapshot downloaded — import on another device.')
  }

  async function onImport(file: File | null) {
    if (!file) return
    try {
      await importSnapshotFile(file)
      toastMsg('Import complete — reloading…')
      window.setTimeout(() => window.location.reload(), 600)
    } catch (e) {
      toastMsg(e instanceof Error ? e.message : 'Import failed')
    }
  }

  async function onReminders() {
    const r = await sendRemindersForTomorrow(listUpcoming(50))
    refresh()
    if (!r.queued) {
      toastMsg('No appointments tomorrow.')
      return
    }
    toastMsg(
      `Reminders: ${r.queued} queued · ${r.sent} sent via Twilio · ${r.native} native SMS fallback. Set TWILIO_* on Netlify for full auto-send.`,
    )
  }

  function dispatchToast(r: { ok: boolean; path: string; error?: string }) {
    if (r.path === 'twilio') return 'Sent via Twilio'
    if (r.path === 'resend') return 'Sent via Resend'
    if (r.path === 'native') return r.ok ? 'Opened native SMS' : 'Queued — Twilio not set'
    if (r.path === 'mailto') return r.ok ? 'Opened email compose' : 'Queued — Resend not set'
    return r.error || 'Queued'
  }

  async function onTestSend() {
    const s = loadOpsSettings()
    if (!s.ownerNotifyPhone && !s.ownerNotifyEmail) {
      toastMsg('Save an owner phone or email first.')
      return
    }
    const queued: OutboundMessage[] = []
    const studio = s.studioName || 'Studio'
    if (s.ownerNotifyPhone) {
      queued.push(
        queueMessage({
          channel: 'sms',
          to: s.ownerNotifyPhone,
          subject: 'GlowUP test',
          body: `GlowUP test from ${studio}. If you got this, Twilio is live.`,
          kind: 'custom',
        }),
      )
    }
    if (s.ownerNotifyEmail) {
      queued.push(
        queueMessage({
          channel: 'email',
          to: s.ownerNotifyEmail,
          subject: `GlowUP test · ${studio}`,
          body: `GlowUP test from ${studio}. If you got this, Resend is live.`,
          kind: 'custom',
        }),
      )
    }
    let sent = 0
    let last = ''
    for (const m of queued) {
      const r = await dispatchMessage(m, { allowNative: false })
      last = dispatchToast(r)
      if (r.ok) sent++
    }
    refresh()
    toastMsg(sent ? `Test sent (${sent}). ${last}` : last || 'Queued — add TWILIO_* / RESEND_API_KEY on Netlify.')
  }

  const glo = getGloUsageSnapshot()
  const proof = computeProofMetrics()
  const plan = getPlan(getSelectedPlanId())
  const deskUrl = syncKey ? salonDeskUrl(syncKey) : ''

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
          <p>OPS · {plan.name.toUpperCase()}</p>
          <h1>Billing · Glo usage · SMS</h1>
          <span>
            {plan.priceLabel}/mo · Glo {glo.used}/{glo.included} this month · deposits + live reminders
          </span>
        </div>
      </div>

      <div className="metric-grid" style={{ marginBottom: '1.25rem' }}>
        <article>
          <div>
            <span>Glo AI this month</span>
          </div>
          <strong>
            {glo.used}/{glo.included}
          </strong>
          <p className="muted-copy">{glo.percent}% of {plan.name} allowance</p>
        </article>
        <article>
          <div>
            <span>AI books</span>
          </div>
          <strong>{proof.totalAiBooks}</strong>
          <p className="muted-copy">{proof.afterHoursAiBooks} after-hours</p>
        </article>
        <article>
          <div>
            <span>Deposit paid rate</span>
          </div>
          <strong>{proof.depositRate}%</strong>
          <p className="muted-copy">
            {proof.depositPaid} paid / {proof.depositRequested || proof.confirmedAppointments} tracked
          </p>
        </article>
        <article>
          <div>
            <span>Plan</span>
          </div>
          <strong>{plan.priceLabel}</strong>
          <p className="muted-copy">
            <button
              type="button"
              className="button-dark button-small"
              style={{ marginTop: 8 }}
              onClick={() => {
                if (plan.id === 'brand') {
                  window.location.href = brandMailto()
                  return
                }
                void startCheckout(plan.id).then((r) => {
                  if (r.url) window.location.href = r.url
                  else toastMsg(r.error || 'Add STRIPE_SECRET_KEY on Netlify for Checkout')
                })
              }}
            >
              Stripe Checkout
            </button>
          </p>
        </article>
      </div>

      <div className="ops-grid">
        {/* Multi-device */}
        <section className="schedule-card ops-card">
          <div className="card-heading">
            <div>
              <span>
                <Cloud size={14} /> MULTI-DEVICE
              </span>
              <h2>Salon sync</h2>
            </div>
          </div>
          <p className="ops-help">
            Same <strong>salon key</strong> is the cloud identity for calendar + CRM. Sign in on a second device and
            the book follows your email. Or paste the key → <strong>Pull</strong>. First device: click{' '}
            <strong>Push to cloud</strong>. If something fails, hard-refresh with <strong>Ctrl+F5</strong>.
          </p>
          <p className="ops-help" style={{ marginTop: 8, fontWeight: 600 }}>
            {cloudStatus}
          </p>
          <label className="ops-label">
            Salon sync key
            <input
              value={syncKey}
              onChange={(e) => {
                const v = e.target.value.trim()
                setSyncKey(v)
                if (v.length >= 8) saveOpsSettings({ salonSyncKey: v, syncEnabled: true })
              }}
              onFocus={(e) => e.currentTarget.select()}
              spellCheck={false}
              autoComplete="off"
            />
          </label>
          <label className="ops-label">
            Glo desk URL
            <input
              value={deskUrl}
              readOnly
              onFocus={(e) => e.currentTarget.select()}
              spellCheck={false}
            />
          </label>
          <p className="ops-help">
            Clients use this link — it is the 24/7 chat desk.
          </p>
          <div className="ops-actions">
            <button
              type="button"
              className="button-cream ops-secondary"
              onClick={() => {
                if (!deskUrl) return
                void navigator.clipboard.writeText(deskUrl).then(() => toastMsg('Glo desk link copied.'))
              }}
            >
              Copy desk link
            </button>
            <button type="button" className="button-dark" onClick={() => void onPush()}>
              <Cloud size={15} /> Push to cloud
            </button>
            <button type="button" className="button-cream ops-secondary" onClick={() => void onPull()}>
              <RefreshCw size={15} /> Pull from cloud
            </button>
            <button type="button" className="button-cream ops-secondary" onClick={onExport}>
              <Download size={15} /> Export
            </button>
            <label className="button-cream ops-secondary ops-file">
              <Upload size={15} /> Import
              <input
                type="file"
                accept="application/json,.json"
                hidden
                onChange={(e) => void onImport(e.target.files?.[0] || null)}
              />
            </label>
            <button
              type="button"
              className="booking-hold-cancel"
              onClick={() => {
                const k = regenerateSalonSyncKey()
                setSyncKey(k)
                toastMsg('New key generated — push again from this device.')
              }}
            >
              New key
            </button>
          </div>
          {settings.lastSyncedAt && (
            <small className="ops-meta">Last sync: {new Date(settings.lastSyncedAt).toLocaleString()}</small>
          )}
        </section>

        {/* Payments */}
        <section className="schedule-card ops-card">
          <div className="card-heading">
            <div>
              <span>
                <CreditCard size={14} /> PAYMENTS
              </span>
              <h2>Deposits (Stripe)</h2>
            </div>
          </div>
          <p className="ops-help">
            Create a <strong>Payment Link</strong> in Stripe Dashboard for deposits. Paste it here. Calendar{' '}
            <strong>Deposit</strong> sends the link; turn on <strong>Auto deposit on book</strong> under messaging to
            mark deposit requested and include the link in the confirm SMS automatically.
          </p>
          <SettingsForm
            settings={settings}
            fields={['studioName', 'stripePaymentLink', 'depositAmount', 'depositCurrency']}
            onSave={saveField}
          />
        </section>

        {/* Messaging */}
        <section className="schedule-card ops-card ops-span">
          <div className="card-heading">
            <div>
              <span>
                <Bell size={14} /> SMS / EMAIL
              </span>
              <h2>Message outbox · Phase B</h2>
            </div>
            <button type="button" className="button-cream ops-secondary" onClick={() => void onReminders()}>
              Send tomorrow reminders
            </button>
            <button type="button" className="button-cream ops-secondary" onClick={() => void onTestSend()}>
              Send test to owner
            </button>
          </div>
          <p className="ops-help">
            <strong>Live SMS:</strong> Netlify <code>TWILIO_ACCOUNT_SID</code>, <code>TWILIO_AUTH_TOKEN</code>,{' '}
            <code>TWILIO_FROM</code>. <strong>Live email:</strong> <code>RESEND_API_KEY</code> (+ optional{' '}
            <code>RESEND_FROM</code>). Without keys, messages stay in outbox — use <strong>Send</strong> for native
            compose. New books auto-queue confirms when messaging is on.
          </p>
          <p className="ops-help" style={{ fontWeight: 600 }}>
            {msgStatus}
          </p>
          <SettingsForm
            settings={settings}
            fields={[
              'ownerNotifyEmail',
              'ownerNotifyPhone',
              'messagingEnabled',
              'autoSmsOnBook',
              'autoOwnerAlert',
              'autoDepositOnBook',
            ]}
            onSave={saveField}
          />
          <ul className="ops-outbox">
            {messages.length === 0 && <li className="booking-holds-empty">No messages yet — book an appointment to queue confirms.</li>}
            {messages.map((m) => (
              <li key={m.id}>
                <div>
                  <strong>
                    {m.channel.toUpperCase()} · {m.kind}
                  </strong>
                  <small>
                    → {m.to} · {m.status} · {new Date(m.createdAt).toLocaleString()}
                  </small>
                  <p>{m.body.slice(0, 160)}{m.body.length > 160 ? '…' : ''}</p>
                </div>
                <div className="ops-msg-actions">
                  <button
                    type="button"
                    className="button-dark button-small"
                    onClick={() => {
                      void dispatchMessage(m).then((r) => {
                        toastMsg(dispatchToast(r))
                        refresh()
                      })
                    }}
                  >
                    Send
                  </button>
                  <button type="button" className="booking-hold-cancel" onClick={() => { copyMessageBody(m); refresh(); toastMsg('Copied') }}>
                    Copy
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  )
}

function SettingsForm({
  settings,
  fields,
  onSave,
}: {
  settings: OpsSettings
  fields: (keyof OpsSettings)[]
  onSave: (p: Partial<OpsSettings>) => void
}) {
  const [form, setForm] = useState(settings)
  useEffect(() => setForm(settings), [settings])

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const patch: Partial<OpsSettings> = {}
    for (const f of fields) {
      // @ts-expect-error index
      patch[f] = form[f]
    }
    onSave(patch)
  }

  return (
    <form className="ops-form" onSubmit={onSubmit}>
      {fields.includes('studioName') && (
        <label>
          Studio name
          <input value={form.studioName} onChange={(e) => setForm({ ...form, studioName: e.target.value })} />
        </label>
      )}
      {fields.includes('stripePaymentLink') && (
        <label>
          Stripe Payment Link URL
          <input
            value={form.stripePaymentLink}
            onChange={(e) => setForm({ ...form, stripePaymentLink: e.target.value })}
            placeholder="https://buy.stripe.com/..."
          />
        </label>
      )}
      {fields.includes('depositAmount') && (
        <label>
          Default deposit amount
          <input value={form.depositAmount} onChange={(e) => setForm({ ...form, depositAmount: e.target.value })} />
        </label>
      )}
      {fields.includes('depositCurrency') && (
        <label>
          Currency
          <input value={form.depositCurrency} onChange={(e) => setForm({ ...form, depositCurrency: e.target.value })} />
        </label>
      )}
      {fields.includes('ownerNotifyEmail') && (
        <label>
          Owner alert email
          <input
            type="email"
            value={form.ownerNotifyEmail}
            onChange={(e) => setForm({ ...form, ownerNotifyEmail: e.target.value })}
            placeholder="you@studio.com"
          />
        </label>
      )}
      {fields.includes('ownerNotifyPhone') && (
        <label>
          Owner alert phone (SMS)
          <input
            value={form.ownerNotifyPhone}
            onChange={(e) => setForm({ ...form, ownerNotifyPhone: e.target.value })}
            placeholder="+1…"
          />
        </label>
      )}
      {fields.includes('messagingEnabled') && (
        <label className="ops-check">
          <input
            type="checkbox"
            checked={form.messagingEnabled}
            onChange={(e) => setForm({ ...form, messagingEnabled: e.target.checked })}
          />
          Messaging enabled
        </label>
      )}
      {fields.includes('autoSmsOnBook') && (
        <label className="ops-check">
          <input
            type="checkbox"
            checked={form.autoSmsOnBook !== false}
            onChange={(e) => setForm({ ...form, autoSmsOnBook: e.target.checked })}
          />
          Auto client confirm on book (SMS/email)
        </label>
      )}
      {fields.includes('autoOwnerAlert') && (
        <label className="ops-check">
          <input
            type="checkbox"
            checked={form.autoOwnerAlert !== false}
            onChange={(e) => setForm({ ...form, autoOwnerAlert: e.target.checked })}
          />
          Auto owner alert on book
        </label>
      )}
      {fields.includes('autoDepositOnBook') && (
        <label className="ops-check">
          <input
            type="checkbox"
            checked={Boolean(form.autoDepositOnBook)}
            onChange={(e) => setForm({ ...form, autoDepositOnBook: e.target.checked })}
          />
          Auto deposit on book (needs Payment Link)
        </label>
      )}
      <button type="submit" className="button-dark button-small">
        Save
      </button>
    </form>
  )
}
