import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import type { CopyCampaign, CopyPack } from '../agents/copywriter'
import { getAgent } from '../lib/glow-agents'
import { loadSalonContext } from '../lib/demo-salon'
import { generateCopyPack } from '../lib/copywriter-client'
import { formatBookGapExtra, snapshotBookGaps } from '../lib/book-gaps'
import {
  enqueueMarketingScan,
  loadLastScan,
  type CalendarScanResult,
} from '../jobs/calendarScanner'
import { dispatchMessage, listMessages, queueMessage } from '../lib/notifications-store'
import { formatReputationExtra, listReviewVisits, type ReviewVisit } from '../lib/reputation'
import {
  FRONT_DESK_INTENTS,
  formatFrontDeskExtra,
  type FrontDeskIntent,
} from '../lib/front-desk'
import {
  BOOK_CLOSER_SAMPLES,
  formatBookCloserExtra,
  intentLabel,
  readBookingIntent,
} from '../lib/book-closer'
import { buildTrendCards, formatTrendExtra, type TrendCard } from '../lib/trend-scout'
import { formatRetailExtra, formatShortsExtra, listMenuItems } from '../lib/retail-menu'
import { listChairMoments } from '../lib/chair-content'
import { formatLeadScoutExtra, listScoutRows, type ScoutRow } from '../lib/lead-scout'
import { formatCompetitorExtra, formatSeoExtra, type CompetitorFact } from '../lib/competitor-scout'
import { huntLocalCompetitors } from '../lib/competitor-hunt-client'
import { saveSalonContext } from '../lib/demo-salon'

export const Route = createFileRoute('/dashboard/social/campaigns')({
  component: SocialCampaigns,
})

const recipes = [
  {
    id: 'rebook' as const,
    title: 'Rebook · color return',
    agent: 'fill_the_book' as const,
    body: 'Soft return for guests 8–14 weeks after color. Written from the live book.',
  },
  {
    id: 'winback' as const,
    title: 'Win-back',
    agent: 'fill_the_book' as const,
    body: 'We miss your chair — calm, editorial, never spammy. 16+ weeks quiet.',
  },
  {
    id: 'launch' as const,
    title: 'New service launch',
    agent: 'retail_services' as const,
    body: 'Spotlight a menu item with booking CTA.',
  },
  {
    id: 'slow' as const,
    title: 'Slow-day fill',
    agent: 'fill_the_book' as const,
    body: 'Fill tomorrow’s open chairs without discounting the brand.',
  },
]

function SocialCampaigns() {
  const salon = useMemo(() => loadSalonContext(), [])
  const gaps = useMemo(() => snapshotBookGaps(), [])
  const [busyId, setBusyId] = useState<string | null>(null)
  const [pack, setPack] = useState<CopyPack | null>(null)
  const [packFor, setPackFor] = useState<string>('')
  const [note, setNote] = useState('')
  const [scan, setScan] = useState<CalendarScanResult | null>(() => loadLastScan())
  const [scanBusy, setScanBusy] = useState(false)
  const [sendNote, setSendNote] = useState('')
  const visits = useMemo(() => listReviewVisits(), [])
  const [reviewVisit, setReviewVisit] = useState<ReviewVisit | null>(null)
  const [reviewSms, setReviewSms] = useState('')
  const [reviewBusy, setReviewBusy] = useState(false)
  const [reviewNote, setReviewNote] = useState('')
  const [reviewQueuedId, setReviewQueuedId] = useState<string | null>(null)
  const [deskIntent, setDeskIntent] = useState<FrontDeskIntent>('thanks')
  const [deskIncoming, setDeskIncoming] = useState(FRONT_DESK_INTENTS.find((i) => i.id === 'thanks')?.sample || '')
  const [deskReply, setDeskReply] = useState('')
  const [deskBusy, setDeskBusy] = useState(false)
  const [deskNote, setDeskNote] = useState('')
  const [closeIncoming, setCloseIncoming] = useState(BOOK_CLOSER_SAMPLES[0])
  const [closeReply, setCloseReply] = useState('')
  const [closeBusy, setCloseBusy] = useState(false)
  const [closeNote, setCloseNote] = useState('')
  const closeIntent = useMemo(() => readBookingIntent(closeIncoming), [closeIncoming])
  const trendCards = useMemo(() => buildTrendCards(new Date(), salon, gaps), [salon, gaps])
  const [trendBusy, setTrendBusy] = useState<string | null>(null)
  const menuItems = useMemo(() => listMenuItems(salon), [salon])
  const chairMoments = useMemo(() => listChairMoments(), [])
  const [retailService, setRetailService] = useState(salon.services[0] || '')
  const [shortsService, setShortsService] = useState(
    chairMoments[0]?.service || salon.services[0] || '',
  )
  const [retailBusy, setRetailBusy] = useState(false)
  const [shortsBusy, setShortsBusy] = useState(false)
  const scoutRows = useMemo(() => listScoutRows(), [])
  const [scoutBusy, setScoutBusy] = useState<string | null>(null)
  const [compNotes, setCompNotes] = useState(salon.competitorNotes || '')
  const [compBusy, setCompBusy] = useState(false)
  const [compHuntBusy, setCompHuntBusy] = useState(false)
  const [competitors, setCompetitors] = useState<CompetitorFact[]>([])
  const [huntNote, setHuntNote] = useState('')
  const [seoBusy, setSeoBusy] = useState(false)

  useEffect(() => {
    const jump = () => {
      const id = window.location.hash.replace(/^#/, '')
      if (!id) return
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    jump()
    window.addEventListener('hashchange', jump)
    return () => window.removeEventListener('hashchange', jump)
  }, [])

  useEffect(() => {
    let cancelled = false
    setScanBusy(true)
    void enqueueMarketingScan()
      .then((result) => {
        if (!cancelled) setScan(result)
      })
      .finally(() => {
        if (!cancelled) setScanBusy(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function runTonightFill() {
    setScanBusy(true)
    setSendNote('')
    try {
      setScan(await enqueueMarketingScan(undefined, { force: true }))
    } finally {
      setScanBusy(false)
    }
  }

  async function sendQueuedDraft() {
    if (!scan?.queuedMessageIds?.length) {
      setSendNote('Nothing in the outbox yet — run the scan first.')
      return
    }
    const msgs = listMessages(80).filter((m) => scan.queuedMessageIds?.includes(m.id))
    if (!msgs.length) {
      setSendNote('Draft is saved. Open Ops outbox if you need to resend.')
      return
    }
    const sent: string[] = []
    for (const msg of msgs) {
      const r = await dispatchMessage(msg, { allowNative: true })
      sent.push(r.path)
    }
    setSendNote(`Sent via ${sent.join(', ')}.`)
  }

  async function draftReviewAsk(visit: ReviewVisit) {
    setReviewBusy(true)
    setReviewNote('Reputation is writing a thank-you…')
    setReviewVisit(visit)
    setReviewQueuedId(null)
    const result = await generateCopyPack({
      salonName: salon.name,
      city: salon.city,
      brandTone: salon.brandTone,
      service: visit.service,
      campaign: 'reputation',
      extra: formatReputationExtra([visit], salon.googleReviewUrl),
    })
    const sms = result.pack.sms
    setReviewSms(sms)
    setPack(result.pack)
    setPackFor('reputation')
    if (visit.phone) {
      const msg = queueMessage({
        channel: 'sms',
        to: visit.phone,
        subject: 'Review ask',
        body: sms.slice(0, 160),
        kind: 'custom',
        relatedAppointmentId: visit.id,
      })
      setReviewQueuedId(msg.id)
    }
    setReviewBusy(false)
    setReviewNote(
      result.fallback
        ? `Offline pack${result.error ? ` (${result.error})` : ''}. Live Copywriter needs XAI_API_KEY.`
        : visit.phone
          ? `Draft queued for ${visit.firstName}. Nothing sent.`
          : `Draft ready. ${visit.firstName} has no phone on file.`,
    )
  }

  async function sendReviewAsk() {
    if (!reviewQueuedId) {
      setReviewNote('Draft a visit first.')
      return
    }
    const msg = listMessages(80).find((m) => m.id === reviewQueuedId)
    if (!msg) {
      setReviewNote('Draft left the outbox. Draft again.')
      return
    }
    const r = await dispatchMessage(msg, { allowNative: true })
    setReviewNote(`Sent via ${r.path}.`)
  }

  function pickDeskIntent(id: FrontDeskIntent) {
    setDeskIntent(id)
    const sample = FRONT_DESK_INTENTS.find((i) => i.id === id)?.sample || ''
    if (id !== 'custom') setDeskIncoming(sample)
  }

  async function draftFrontDesk() {
    const incoming = deskIncoming.trim()
    if (!incoming) {
      setDeskNote('Paste the comment or DM first.')
      return
    }
    setDeskBusy(true)
    setDeskNote('Front Desk is writing a reply…')
    const result = await generateCopyPack({
      salonName: salon.name,
      city: salon.city,
      brandTone: salon.brandTone,
      service: salon.services[0],
      campaign: 'front_desk',
      extra: formatFrontDeskExtra({ incoming, intent: deskIntent, salon }),
    })
    const reply = result.pack.instagram || result.pack.variants[0] || result.pack.sms
    setDeskReply(reply)
    setPack(result.pack)
    setPackFor('front_desk')
    setDeskBusy(false)
    setDeskNote(
      result.fallback
        ? `Offline pack${result.error ? ` (${result.error})` : ''}.`
        : 'Reply ready. Copy it into Instagram or your DM. GlowUP does not post comments yet.',
    )
  }

  async function draftBookClose() {
    const incoming = closeIncoming.trim()
    if (!incoming) {
      setCloseNote('Paste the comment or DM first.')
      return
    }
    setCloseBusy(true)
    setCloseNote('Book Closer is writing…')
    const intent = readBookingIntent(incoming)
    const result = await generateCopyPack({
      salonName: salon.name,
      city: salon.city,
      brandTone: salon.brandTone,
      service: salon.services[0],
      campaign: 'book_closer',
      extra: formatBookCloserExtra({ incoming, salon, intent }),
    })
    const reply = result.pack.instagram || result.pack.variants[0] || result.pack.sms
    setCloseReply(reply)
    setPack(result.pack)
    setPackFor('book_closer')
    setCloseBusy(false)
    if (!salon.externalBookingUrl) {
      setCloseNote(
        result.fallback
          ? `Offline pack${result.error ? ` (${result.error})` : ''}. Add a booking URL in Brand.`
          : 'Reply ready. No booking URL in Brand — add one so the close can include a real link.',
      )
    } else {
      setCloseNote(
        result.fallback
          ? `Offline pack${result.error ? ` (${result.error})` : ''}.`
          : 'Reply ready. Copy it into the comment or DM. GlowUP does not post.',
      )
    }
  }

  async function copyCloseReply() {
    if (!closeReply) return
    try {
      await navigator.clipboard.writeText(closeReply)
      setCloseNote('Copied. Paste into the comment or DM.')
    } catch {
      setCloseNote('Could not copy. Select the reply and copy it yourself.')
    }
  }

  async function copyDeskReply() {
    if (!deskReply) return
    try {
      await navigator.clipboard.writeText(deskReply)
      setDeskNote('Copied. Paste into the comment or DM.')
    } catch {
      setDeskNote('Could not copy. Select the reply and copy it yourself.')
    }
  }

  async function draftTrend(card: TrendCard) {
    setTrendBusy(card.id)
    setNote('Trend Scout is writing from the menu and the book…')
    const result = await generateCopyPack({
      salonName: salon.name,
      city: salon.city,
      brandTone: salon.brandTone,
      service: card.service,
      campaign: 'trend',
      extra: formatTrendExtra(card, snapshotBookGaps()),
    })
    setPack(result.pack)
    setPackFor('trend')
    setTrendBusy(null)
    setNote(
      result.fallback
        ? `Offline pack${result.error ? ` (${result.error})` : ''}.`
        : `Angle: ${card.title}. Social does not name guests.`,
    )
  }

  async function draftRetail() {
    if (!retailService) {
      setNote('Add a service on Brand first.')
      return
    }
    setRetailBusy(true)
    setNote('Retail & Services is writing a spotlight…')
    const result = await generateCopyPack({
      salonName: salon.name,
      city: salon.city,
      brandTone: salon.brandTone,
      service: retailService,
      campaign: 'launch',
      extra: formatRetailExtra({
        service: retailService,
        salon,
        bookingUrl: salon.externalBookingUrl,
      }),
    })
    setPack(result.pack)
    setPackFor('launch')
    setRetailBusy(false)
    setNote(
      result.fallback
        ? `Offline pack${result.error ? ` (${result.error})` : ''}.`
        : `Spotlight: ${retailService}. No invented price.`,
    )
  }

  async function draftShorts() {
    if (!shortsService) {
      setNote('Pick a service first.')
      return
    }
    setShortsBusy(true)
    setNote('Shorts is writing hooks…')
    const chair = chairMoments.find((c) => c.service === shortsService) || chairMoments[0]
    const result = await generateCopyPack({
      salonName: salon.name,
      city: salon.city,
      brandTone: salon.brandTone,
      service: shortsService,
      campaign: 'shorts',
      extra: formatShortsExtra({ service: shortsService, chair, salon }),
    })
    setPack(result.pack)
    setPackFor('shorts')
    setShortsBusy(false)
    setNote(
      result.fallback
        ? `Offline pack${result.error ? ` (${result.error})` : ''}.`
        : 'Three hooks + Reel/TikTok caption. Social does not name guests.',
    )
  }

  async function huntCompetitors() {
    if (!salon.city.trim()) {
      setHuntNote('Add a city in Brand / onboarding first.')
      return
    }
    setCompHuntBusy(true)
    setHuntNote(`Hunting nearby floors in ${salon.city} and reading public $…`)
    const result = await huntLocalCompetitors(salon.city, salon.name)
    setCompetitors(result.competitors)
    setCompHuntBusy(false)
    setHuntNote(
      result.error
        ? result.error
        : result.note ||
            (result.competitors.length
              ? `Found ${result.competitors.length} nearby floors.`
              : 'No competitors pulled.'),
    )
  }

  async function draftCompetitor() {
    setCompBusy(true)
    saveSalonContext({ competitorNotes: compNotes })
    setNote(
      competitors.length
        ? 'Competitor Scout is writing from Google listings and public $…'
        : 'No hunt yet — writing from notes only. Hunt competitors for live prices.',
    )
    const result = await generateCopyPack({
      salonName: salon.name,
      city: salon.city,
      brandTone: salon.brandTone,
      service: salon.services[0],
      campaign: 'competitor',
      extra: formatCompetitorExtra({ ...salon, competitorNotes: compNotes }, compNotes, competitors),
    })
    setPack(result.pack)
    setPackFor('competitor')
    setCompBusy(false)
    setNote(
      result.fallback
        ? `Offline pack${result.error ? ` (${result.error})` : ''}.`
        : competitors.length
          ? 'Brief ready from pulled listings. Social does not attack a competitor by name. Missing $ stayed “not listed.”'
          : 'Brief from notes only. Hunt competitors to pull Google + public prices.',
    )
  }

  async function draftLead(row: ScoutRow) {
    setScoutBusy(row.id)
    setNote(`Lead Scout is writing for ${row.firstName}…`)
    const result = await generateCopyPack({
      salonName: salon.name,
      city: salon.city,
      brandTone: salon.brandTone,
      service: row.service,
      campaign: 'lead_scout',
      extra: formatLeadScoutExtra(row, salon.externalBookingUrl),
    })
    setPack(result.pack)
    setPackFor('lead_scout')
    if (row.phone) {
      queueMessage({
        channel: 'sms',
        to: row.phone,
        subject: 'Lead Scout',
        body: result.pack.sms.slice(0, 160),
        kind: 'custom',
      })
    }
    setScoutBusy(null)
    setNote(
      result.fallback
        ? `Offline pack${result.error ? ` (${result.error})` : ''}.`
        : `${row.firstName} · ${row.band} · ${row.points} fact-points. Queued if phone on file. Not sent.`,
    )
  }

  async function draftSeo() {
    setSeoBusy(true)
    setNote('Local SEO is drafting title, meta, and a GBP post…')
    const result = await generateCopyPack({
      salonName: salon.name,
      city: salon.city,
      brandTone: salon.brandTone,
      service: salon.services[0],
      campaign: 'seo',
      extra: formatSeoExtra(salon),
    })
    setPack(result.pack)
    setPackFor('seo')
    setSeoBusy(false)
    setNote(
      result.fallback
        ? `Offline pack${result.error ? ` (${result.error})` : ''}.`
        : 'Title, meta, and GBP post from your name, city, and menu. No invented rank.',
    )
  }

  async function draftFromBook(campaign: CopyCampaign) {
    setBusyId(campaign)
    setNote('Fill the Book is reading the live book…')
    const extra = formatBookGapExtra(campaign, snapshotBookGaps())
    const result = await generateCopyPack({
      salonName: salon.name,
      city: salon.city,
      brandTone: salon.brandTone,
      service: salon.services.find((s) => /color|balayage|gloss/i.test(s)) || salon.services[0],
      campaign,
      extra,
    })
    setPack(result.pack)
    setPackFor(campaign)
    setBusyId(null)
    setNote(
      result.fallback
        ? 'Offline pack from the book. Deploy Copywriter + xAI for live drafts.'
        : 'Drafted from the live book. Social does not name guests.',
    )
  }

  return (
    <div className="campaigns-module">
      <h2 id="copywriter">Campaigns</h2>
      <p className="muted-copy">
        Fill the Book reads tomorrow’s chairs and return windows. Agent: {getAgent('fill_the_book')?.name} · writer:{' '}
        {getAgent('copywriter')?.name}.
      </p>

      <div className="book-gap-bar">
        <span>
          <strong>{gaps.openChairs.length}</strong> open chairs tomorrow
        </span>
        <span>
          <strong>{gaps.rebookDue.length}</strong> color returns due
        </span>
        <span>
          <strong>{gaps.winbackDue.length}</strong> quiet 16+ weeks
        </span>
        <span>
          <strong>{gaps.bookedTomorrow}</strong> already on {gaps.tomorrowLabel}
        </span>
      </div>

      <section className="scan-card" id="fill-the-book">
        <h3>Tonight’s fill</h3>
        <p className="muted-copy">
          Scans tomorrow’s empty chairs, then drafts one note for the quiet guest with the most
          visits (60+ days). No auto-send. No invented discount.
        </p>
        {scanBusy && <p className="muted-copy">Scanning the live book…</p>}
        {scan && !scanBusy && (
          <>
            <p>
              <strong>{scan.emptySlotCount}</strong> open chairs
              {scan.targetClient
                ? ` · ${scan.targetClient.firstName}, ${scan.targetClient.lastServiceType}, ${scan.targetClient.daysSince} days quiet, ${scan.targetClient.visitCount} visits`
                : ' · no matching overdue guest'}
            </p>
            {scan.bodyText && (
              <p>
                <strong>{scan.suggestedChannel === 'email' ? 'Email draft' : 'SMS draft'}</strong>
                {scan.bodyText}
              </p>
            )}
            {scan.fallback && (
              <p className="muted-copy">
                Offline pack
                {scan.error ? ` (${scan.error})` : ''}. Add XAI_API_KEY to a local .env, restart
                the server, then Scan tomorrow.
              </p>
            )}
          </>
        )}
        {sendNote && <p className="muted-copy">{sendNote}</p>}
        <div className="recipe-actions">
          <button
            type="button"
            className="button button-dark button-small"
            disabled={scanBusy}
            onClick={() => void runTonightFill()}
          >
            {scanBusy ? 'Scanning…' : 'Scan tomorrow'}
          </button>
          {scan?.bodyText && (
            <button
              type="button"
              className="button button-cream button-small"
              disabled={scanBusy || !scan.queuedMessageIds?.length}
              onClick={() => void sendQueuedDraft()}
            >
              {scan.targetClient
                ? `Send to ${scan.targetClient.firstName}`
                : 'Send draft'}
            </button>
          )}
        </div>
      </section>

      <section className="scan-card" id="reputation">
        <h3>Reputation · post-visit</h3>
        <p className="muted-copy">
          Thank-you + review ask for yesterday’s visits and today’s completed chairs. No auto-send.
          No invented Google link
          {salon.googleReviewUrl ? '' : ' — add one in Brand if you have it'}.
        </p>
        {visits.length === 0 ? (
          <p className="muted-copy">
            No post-visit rows. Mark yesterday on Calendar, or complete today’s appointment after they
            leave.
          </p>
        ) : (
          <ul className="review-visit-list">
            {visits.map((v) => (
              <li key={v.id}>
                <span>
                  <strong>{v.firstName}</strong> · {v.service} · {v.when} {v.time}
                </span>
                <button
                  type="button"
                  className="button button-dark button-small"
                  disabled={reviewBusy}
                  onClick={() => void draftReviewAsk(v)}
                >
                  {reviewBusy && reviewVisit?.id === v.id ? 'Writing…' : 'Draft ask'}
                </button>
              </li>
            ))}
          </ul>
        )}
        {reviewSms && (
          <p>
            <strong>SMS draft</strong>
            {reviewSms}
          </p>
        )}
        {reviewNote && <p className="muted-copy">{reviewNote}</p>}
        {reviewSms && (
          <div className="recipe-actions">
            <button
              type="button"
              className="button button-cream button-small"
              disabled={reviewBusy || !reviewQueuedId}
              onClick={() => void sendReviewAsk()}
            >
              {reviewVisit ? `Send to ${reviewVisit.firstName}` : 'Send draft'}
            </button>
          </div>
        )}
      </section>

      <section className="scan-card" id="front-desk">
        <h3>Front Desk · replies</h3>
        <p className="muted-copy">
          Draft a comment or DM reply in your salon voice. Does not post. Will not invent hours or
          prices.
        </p>
        <div className="recipe-actions">
          {FRONT_DESK_INTENTS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`button button-small ${deskIntent === item.id ? 'button-dark' : 'button-cream'}`}
              onClick={() => pickDeskIntent(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <label className="field-label">
          Incoming comment or DM
          <textarea
            rows={3}
            value={deskIncoming}
            onChange={(e) => {
              setDeskIncoming(e.target.value)
              setDeskIntent('custom')
            }}
            placeholder="Paste what they wrote"
          />
        </label>
        <div className="recipe-actions">
          <button
            type="button"
            className="button button-dark button-small"
            disabled={deskBusy}
            onClick={() => void draftFrontDesk()}
          >
            {deskBusy ? 'Writing…' : 'Draft reply'}
          </button>
          {deskReply && (
            <button type="button" className="button button-cream button-small" onClick={() => void copyDeskReply()}>
              Copy reply
            </button>
          )}
        </div>
        {deskReply && (
          <p>
            <strong>Public reply</strong>
            {deskReply}
          </p>
        )}
        {deskNote && <p className="muted-copy">{deskNote}</p>}
      </section>

      <section className="scan-card" id="book-closer">
        <h3>Book Closer · intent → book</h3>
        <p className="muted-copy">
          Ranks the words they wrote (hot / warm / nurture). Not a fake close rate. Uses your Brand
          booking URL if you have one. Does not post.
        </p>
        <div className="recipe-actions">
          {BOOK_CLOSER_SAMPLES.map((sample) => (
            <button
              key={sample}
              type="button"
              className="button button-cream button-small"
              onClick={() => setCloseIncoming(sample)}
            >
              {sample.slice(0, 28)}
              {sample.length > 28 ? '…' : ''}
            </button>
          ))}
        </div>
        <label className="field-label">
          Incoming comment or DM
          <textarea
            rows={3}
            value={closeIncoming}
            onChange={(e) => setCloseIncoming(e.target.value)}
            placeholder="Paste a booking-intent message"
          />
        </label>
        {closeIncoming.trim() && (
          <p className="muted-copy">
            <strong>{intentLabel(closeIntent.band)}</strong>
            {closeIntent.reasons.join(' ')}
          </p>
        )}
        <div className="recipe-actions">
          <button
            type="button"
            className="button button-dark button-small"
            disabled={closeBusy}
            onClick={() => void draftBookClose()}
          >
            {closeBusy ? 'Writing…' : 'Draft close'}
          </button>
          {closeReply && (
            <button type="button" className="button button-cream button-small" onClick={() => void copyCloseReply()}>
              Copy reply
            </button>
          )}
        </div>
        {closeReply && (
          <p>
            <strong>Close</strong>
            {closeReply}
          </p>
        )}
        {closeNote && <p className="muted-copy">{closeNote}</p>}
      </section>

      <section className="scan-card" id="trend-scout">
        <h3>Trend Scout · this week</h3>
        <p className="muted-copy">
          Angles from your menu, this month, and the live book. Not a viral ranking. Social will not
          name guests.
        </p>
        <ul className="review-visit-list">
          {trendCards.map((card) => (
            <li key={card.id}>
              <span>
                <strong>{card.title}</strong>
                <br />
                {card.why}
              </span>
              <button
                type="button"
                className="button button-dark button-small"
                disabled={trendBusy === card.id}
                onClick={() => void draftTrend(card)}
              >
                {trendBusy === card.id ? 'Writing…' : 'Draft pack'}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="scan-card" id="shorts">
        <h3>Shorts · hooks</h3>
        <p className="muted-copy">
          Three spoken first lines and a Reel/TikTok caption for one real service. No fake trend
          score.
        </p>
        <label className="field-label">
          Service
          <select value={shortsService} onChange={(e) => setShortsService(e.target.value)}>
            {menuItems.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="button button-dark button-small"
          disabled={shortsBusy}
          onClick={() => void draftShorts()}
        >
          {shortsBusy ? 'Writing…' : 'Draft hooks'}
        </button>
      </section>

      <section className="scan-card" id="retail">
        <h3>Retail & Services · menu spotlight</h3>
        <p className="muted-copy">
          Promote one item from your real menu. Will not invent a price or a booking link.
        </p>
        <label className="field-label">
          Menu item
          <select value={retailService} onChange={(e) => setRetailService(e.target.value)}>
            {menuItems.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="button button-dark button-small"
          disabled={retailBusy}
          onClick={() => void draftRetail()}
        >
          {retailBusy ? 'Writing…' : 'Draft spotlight'}
        </button>
      </section>

      <section className="scan-card" id="competitor-scout">
        <h3>Competitor Scout</h3>
        <p className="muted-copy">
          Hunts nearby salons in {salon.city || 'your city'} on Google, then reads public $ on their
          sites. Will not invent occupancy or a price that is not on the page.
        </p>
        <div className="recipe-actions">
          <button
            type="button"
            className="button button-dark button-small"
            disabled={compHuntBusy || !salon.city.trim()}
            onClick={() => void huntCompetitors()}
          >
            {compHuntBusy ? 'Hunting…' : 'Hunt nearby competitors'}
          </button>
          <button
            type="button"
            className="button button-cream button-small"
            disabled={compBusy}
            onClick={() => void draftCompetitor()}
          >
            {compBusy ? 'Writing…' : 'Draft brief'}
          </button>
        </div>
        {huntNote && <p className="muted-copy">{huntNote}</p>}
        {competitors.length > 0 && (
          <ul className="review-visit-list">
            {competitors.map((c) => (
              <li key={c.url || c.title}>
                <strong>{c.title}</strong>
                <span>
                  {c.ratingSnippet || c.address || 'Google listing'}
                  {c.prices.length
                    ? ` · ${c.prices.slice(0, 3).join(' · ')}`
                    : ` · ${c.priceNote}`}
                </span>
                {c.url.startsWith('http') && !/google\.com\/search/i.test(c.url) ? (
                  <a href={c.url} target="_blank" rel="noreferrer">
                    Site
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        <label className="field-label">
          Extra you know (optional)
          <textarea
            rows={3}
            value={compNotes}
            onChange={(e) => setCompNotes(e.target.value)}
            placeholder="Optional — anything Google won’t show (they don’t book online, waitlist only…)"
          />
        </label>
      </section>

      <section className="scan-card" id="lead-scout">
        <h3>Lead Scout · already in the book</h3>
        <p className="muted-copy">
          For this salon’s guests only. Ranks Glo/CRM and one overdue guest on facts — not a fake
          close percent. To sell GlowUP to other salons, use{' '}
          <Link to="/dashboard/platform">Platform → Company Lead Scout</Link>.
        </p>
        {scoutRows.length === 0 ? (
          <p className="muted-copy">No open leads and no overdue guest. Capture a lead in Glo or wait for the book.</p>
        ) : (
          <ul className="review-visit-list">
            {scoutRows.slice(0, 8).map((row) => (
              <li key={row.id}>
                <span>
                  <strong>{row.firstName}</strong> · {row.band} · {row.points} pts · {row.service}
                  <br />
                  {row.reasons.slice(0, 3).join(' · ')}
                </span>
                <button
                  type="button"
                  className="button button-dark button-small"
                  disabled={scoutBusy === row.id}
                  onClick={() => void draftLead(row)}
                >
                  {scoutBusy === row.id ? 'Writing…' : 'Draft outreach'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="scan-card" id="local-seo">
        <h3>Local SEO</h3>
        <p className="muted-copy">
          Title tag, meta, and a Google Business post from {salon.name}
          {salon.city ? ` in ${salon.city}` : ''}. Will not invent a ranking.
        </p>
        <button
          type="button"
          className="button button-dark button-small"
          disabled={seoBusy}
          onClick={() => void draftSeo()}
        >
          {seoBusy ? 'Writing…' : 'Draft SEO pack'}
        </button>
      </section>

      <div className="recipe-grid">
        {recipes.map((recipe) => (
          <article key={recipe.id}>
            <span className="agent-chip">{getAgent(recipe.agent)?.name}</span>
            <h3>{recipe.title}</h3>
            <p>{recipe.body}</p>
            <div className="recipe-actions">
              {recipe.agent === 'retail_services' && (
                <button
                  type="button"
                  className="button button-dark button-small"
                  disabled={retailBusy}
                  onClick={() => void draftRetail()}
                >
                  {retailBusy ? 'Writing…' : 'Draft spotlight'}
                </button>
              )}
              {recipe.agent === 'fill_the_book' && (
                <button
                  type="button"
                  className="button button-dark button-small"
                  disabled={busyId === recipe.id}
                  onClick={() => draftFromBook(recipe.id)}
                >
                  {busyId === recipe.id ? 'Writing…' : 'Draft from book'}
                </button>
              )}
              <Link
                className="button button-cream button-small"
                to="/dashboard/social/studio"
                search={{ from: undefined, trend: undefined, campaign: recipe.id }}
              >
                Open in Studio
              </Link>
            </div>
          </article>
        ))}
      </div>

      {pack && (
        <section className="copy-pack-preview">
          <h3>
            {getAgent('copywriter')?.name} pack · {packFor}
          </h3>
          {note && <p className="muted-copy">{note}</p>}
          <p>
            <strong>SMS</strong> {pack.sms}
          </p>
          <p>
            <strong>Email</strong> {pack.email.subject}
            <br />
            {pack.email.body}
          </p>
          <p>
            <strong>Instagram</strong> {pack.instagram}
          </p>
          <p>
            <strong>TikTok</strong> {pack.tiktok}
          </p>
          {pack.variants?.length > 0 && (
            <p>
              <strong>Hooks / variants</strong>
              {pack.variants.map((v, i) => (
                <span key={i}>
                  {i + 1}. {v}
                  <br />
                </span>
              ))}
            </p>
          )}
          <Link
            className="button button-cream button-small"
            to="/dashboard/social/studio"
            search={{ from: undefined, trend: undefined, campaign: packFor }}
          >
            Edit in Studio
          </Link>
        </section>
      )}
    </div>
  )
}
