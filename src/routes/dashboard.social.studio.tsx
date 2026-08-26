import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import type { CopyCampaign } from '../agents/copywriter'
import { getAgent, PLATFORM_ORDER } from '../lib/glow-agents'
import { loadSalonContext } from '../lib/demo-salon'
import { generateCopyPack } from '../lib/copywriter-client'
import { formatBookGapExtra, snapshotBookGaps } from '../lib/book-gaps'
import { formatChairExtra, listChairMoments, type ChairMoment } from '../lib/chair-content'
import { saveDraft } from '../lib/draft-store'
import { buildTrendCards, formatTrendExtra } from '../lib/trend-scout'

export const Route = createFileRoute('/dashboard/social/studio')({
  validateSearch: (search: Record<string, unknown>) => ({
    from: typeof search.from === 'string' ? search.from : undefined,
    trend: typeof search.trend === 'string' ? search.trend : undefined,
    campaign: typeof search.campaign === 'string' ? search.campaign : undefined,
  }),
  component: SocialStudio,
})

const CAPTION_VARIANTS = [
  'Soft glass finish after gloss — light that moves with you. When you are ready, your chair is waiting.',
  'Gloss that catches every doorway. Quiet luxury for weekdays and nights out.',
  'Process, polish, glow. Book your next finish when the calendar opens.',
]

function campaignFromSearch(search: { from?: string; trend?: string; campaign?: string }): CopyCampaign {
  if (
    search.campaign === 'rebook' ||
    search.campaign === 'winback' ||
    search.campaign === 'launch' ||
    search.campaign === 'slow' ||
    search.campaign === 'trend' ||
    search.campaign === 'shorts'
  ) {
    return search.campaign
  }
  if (search.from === 'chair') return 'chair'
  if (search.trend) return 'trend'
  return 'general'
}

function SocialStudio() {
  const salon = useMemo(() => loadSalonContext(), [])
  const search = Route.useSearch()
  const chairs = useMemo(() => listChairMoments(), [])
  const trendCards = useMemo(() => buildTrendCards(), [])
  const trendCard = trendCards.find((c) => c.id === search.trend) || trendCards[0]
  const campaign = campaignFromSearch(search)
  const [caption, setCaption] = useState(CAPTION_VARIANTS[0])
  const [variants, setVariants] = useState<string[]>(CAPTION_VARIANTS)
  const [chairId, setChairId] = useState<string>(chairs[0]?.id || '')
  const [service, setService] = useState(chairs[0]?.service || salon.services[0] || 'Color services')
  const [notes, setNotes] = useState(chairs[0]?.notes || '')
  const [generating, setGenerating] = useState(false)
  const [consentFace, setConsentFace] = useState(false)
  const [consentBack, setConsentBack] = useState(true)
  const [platforms, setPlatforms] = useState<string[]>(['facebook', 'instagram'])
  const [statusNote, setStatusNote] = useState('')
  const [role, setRole] = useState<'owner' | 'stylist'>('stylist')

  const selectedChair: ChairMoment | undefined = chairs.find((c) => c.id === chairId)

  const source =
    search.from === 'chair' || campaign === 'chair'
      ? selectedChair
        ? `Chair · ${selectedChair.label}`
        : 'Chair · no service on today’s book'
      : campaign === 'trend' || search.trend
        ? `Trend Scout · ${trendCard?.title || 'weekly angle'}`
        : search.campaign
          ? `Campaign · ${search.campaign}`
          : 'Blank + brand tone'

  function pickChair(id: string) {
    setChairId(id)
    const next = chairs.find((c) => c.id === id)
    if (next) {
      setService(next.service)
      setNotes(next.notes)
    }
  }

  function togglePlatform(id: string) {
    setPlatforms((current) =>
      current.includes(id) ? current.filter((p) => p !== id) : [...current, id],
    )
  }

  function submit() {
    if (!consentFace && !consentBack) {
      setStatusNote('Turn on at least one consent scope, or use product-only frames.')
      return
    }
    const draft = saveDraft({
      status: role === 'stylist' ? 'pending_approval' : 'approved',
      service,
      caption,
      variants,
      platforms,
      sourceLabel: source,
      agentId:
        campaign === 'chair' || search.from === 'chair'
          ? 'chair_content'
          : campaign === 'trend'
            ? 'trend_scout'
            : 'copywriter',
      author: role === 'stylist' ? selectedChair?.stylist || 'Stylist' : 'Owner',
      authorRole: role,
      consentFace,
      consentBack,
    })
    if (role === 'stylist') {
      setStatusNote(`Submitted for approval (${draft.id.slice(0, 8)}). Owner sees it in Concierge.`)
    } else {
      setStatusNote('Draft approved. Open Schedule for assist publish.')
    }
  }

  return (
    <div className="studio-layout">
      <section className="studio-source">
        <p className="eyebrow-inline">STUDIO · {getAgent('copywriter')?.name} + {getAgent('chair_content')?.name}</p>
        <h2>Create a draft</h2>
        <p className="muted-copy">Brand tone: {salon.brandTone}. Copywriter writes; you stay in control.</p>

        <label className="field-label">
          You are posting as
          <select value={role} onChange={(e) => setRole(e.target.value as 'owner' | 'stylist')}>
            <option value="stylist">Stylist (requires approval)</option>
            <option value="owner">Owner / manager (can approve)</option>
          </select>
        </label>

        <div className="source-box">
          <strong>Source</strong>
          <span>{source}</span>
        </div>

        {(search.from === 'chair' || campaign === 'chair' || chairs.length > 0) && (
          <label className="field-label">
            Today’s chair
            <select value={chairId} onChange={(e) => pickChair(e.target.value)}>
              {chairs.length === 0 && <option value="">No services on today’s book</option>}
              {chairs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="field-label">
          Service
          <select value={service} onChange={(e) => setService(e.target.value)}>
            {salon.services.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className="field-label">
          Stylist notes
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Finish, formula, vibe — not the guest’s name"
          />
        </label>

        <div className="consent-box">
          <strong>Client photo consent</strong>
          <p>We will not show a face until consent is on.</p>
          <label className="check-row">
            <input type="checkbox" checked={consentFace} onChange={(e) => setConsentFace(e.target.checked)} />
            Use face
          </label>
          <label className="check-row">
            <input type="checkbox" checked={consentBack} onChange={(e) => setConsentBack(e.target.checked)} />
            Back-of-head / hands only
          </label>
        </div>

        <div className="platform-picks">
          <strong>Platforms</strong>
          <p className="muted-copy">Order of truth: Facebook → Instagram → TikTok</p>
          {PLATFORM_ORDER.filter((p) => p !== 'other').map((p) => (
            <label key={p} className="check-row">
              <input
                type="checkbox"
                checked={platforms.includes(p)}
                onChange={() => togglePlatform(p)}
              />
              {p}
            </label>
          ))}
        </div>
      </section>

      <section className="studio-canvas">
        <div className="phone-frame">
          <span className="phone-label">Reel preview</span>
          <div className="phone-media">{consentFace ? 'Face OK' : consentBack ? 'Detail crop' : 'Add media'}</div>
          <p className="phone-caption">{caption}</p>
          {salon.externalBookingUrl ? (
            <a className="phone-cta" href={salon.externalBookingUrl} target="_blank" rel="noreferrer">
              Book →
            </a>
          ) : (
            <span className="phone-cta muted">Add booking URL in Brand</span>
          )}
        </div>

        <label className="field-label">
          Caption
          <textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={5} />
        </label>

        <div className="variant-row">
          <span>{getAgent('copywriter')?.name} · 3 variants</span>
          <div className="variant-chips">
            {variants.map((v, i) => (
              <button type="button" key={i} className={caption === v ? 'active' : ''} onClick={() => setCaption(v)}>
                Variant {i + 1}
              </button>
            ))}
          </div>
        </div>

        <div className="studio-actions">
          <button
            type="button"
            className="button button-cream"
            disabled={generating}
            onClick={async () => {
              setGenerating(true)
              setStatusNote('Copywriter is drafting…')
              const book =
                campaign === 'rebook' || campaign === 'winback' || campaign === 'slow'
                  ? formatBookGapExtra(campaign, snapshotBookGaps())
                  : ''
              const chair =
                selectedChair
                  ? formatChairExtra(
                      { ...selectedChair, notes: notes || selectedChair.notes },
                      { face: consentFace, back: consentBack },
                    )
                  : campaign === 'chair'
                    ? 'CHAIR MOMENT: no matching row on today’s book. Do not invent a service.'
                    : ''
              const trend =
                campaign === 'trend' && trendCard
                  ? formatTrendExtra(trendCard, snapshotBookGaps())
                  : ''
              const result = await generateCopyPack({
                salonName: salon.name,
                city: salon.city,
                brandTone: salon.brandTone,
                service: trendCard && campaign === 'trend' ? trendCard.service : service,
                campaign: search.from === 'chair' ? 'chair' : campaign,
                extra: [source, notes && `Stylist notes: ${notes}`, book, chair, trend]
                  .filter(Boolean)
                  .join('\n'),
              })
              const next = result.pack.variants.length ? result.pack.variants : [result.pack.instagram]
              setVariants(next)
              setCaption(next[0] || result.pack.instagram)
              setGenerating(false)
              setStatusNote(
                result.fallback
                  ? 'Offline pack ready. Connect xAI on Netlify for live Copywriter.'
                  : 'Copywriter drafted 3 variants plus SMS/email in the pack.',
              )
            }}
          >
            {generating ? 'Writing…' : 'Generate with Copywriter'}
          </button>
          <button
            type="button"
            className="button button-cream"
            onClick={() => {
              saveDraft({
                status: 'draft',
                service,
                caption,
                variants,
                platforms,
                sourceLabel: source,
                agentId:
                  search.from === 'chair' || campaign === 'chair'
                    ? 'chair_content'
                    : campaign === 'trend'
                      ? 'trend_scout'
                      : 'copywriter',
                author: role === 'stylist' ? selectedChair?.stylist || 'Stylist' : 'Owner',
                authorRole: role,
                consentFace,
                consentBack,
              })
              setStatusNote('Draft saved. Submit for approval when the caption is ready.')
            }}
          >
            Save draft
          </button>
          <button type="button" className="button button-dark" onClick={submit}>
            {role === 'stylist' ? 'Submit for approval' : 'Approve & continue'}
          </button>
        </div>
        {statusNote && <div className="form-message studio-note">{statusNote}</div>}
      </section>
    </div>
  )
}
