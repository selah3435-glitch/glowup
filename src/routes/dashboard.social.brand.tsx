import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState, type FormEvent } from 'react'
import { ensureSalonDeskBookingUrl, salonDeskUrl } from '../lib/cloud-sync'
import { loadSalonContext, saveSalonContext, type SalonContext } from '../lib/demo-salon'
import { ensureSalonSyncKey } from '../lib/ops-settings'

export const Route = createFileRoute('/dashboard/social/brand')({
  component: SocialBrand,
})

function SocialBrand() {
  const [form, setForm] = useState<SalonContext>(loadSalonContext())
  const [saved, setSaved] = useState(false)
  const [deskUrl, setDeskUrl] = useState('')

  useEffect(() => {
    const url = ensureSalonDeskBookingUrl()
    setDeskUrl(url)
    setForm(loadSalonContext())
  }, [])

  function save(e: FormEvent) {
    e.preventDefault()
    const nextUrl = form.externalBookingUrl.trim() || deskUrl || ensureSalonDeskBookingUrl()
    saveSalonContext({ ...form, externalBookingUrl: nextUrl })
    setForm(loadSalonContext())
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2200)
  }

  function useGloDesk() {
    const key = ensureSalonSyncKey()
    const url = salonDeskUrl(key)
    setDeskUrl(url)
    setForm((current) => ({ ...current, externalBookingUrl: url }))
  }

  const bookHref = form.externalBookingUrl || deskUrl || '#'

  return (
    <div className="brand-module">
      <form className="brand-form" onSubmit={save}>
        <h2>Brand kit</h2>
        <p className="muted-copy">
          Voice from onboarding. Guests book through Glo at <code>/book/your-key</code> unless you override with
          Vagaro, Square, or another link.
        </p>

        <label className="field-label">
          Studio name
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </label>

        <label className="field-label">
          Brand tone
          <select
            value={form.brandTone}
            onChange={(e) => setForm({ ...form, brandTone: e.target.value })}
          >
            <option>Soft & romantic</option>
            <option>Clean & editorial</option>
            <option>Warm & earthy</option>
            <option>Bold & modern</option>
          </select>
        </label>

        <label className="field-label">
          Booking URL
          <input
            type="url"
            placeholder={deskUrl || 'https://…/book/your-key'}
            value={form.externalBookingUrl}
            onChange={(e) => setForm({ ...form, externalBookingUrl: e.target.value })}
          />
        </label>
        <p className="field-hint">
          Default is this studio’s Glo desk (chat books the cloud calendar). Override only if guests should land
          somewhere else.
        </p>
        {deskUrl && (
          <p className="field-hint">
            Glo desk: <a href={deskUrl}>{deskUrl}</a>{' '}
            <button type="button" className="button button-cream button-small" onClick={useGloDesk}>
              Use Glo desk
            </button>
          </p>
        )}

        <label className="field-label">
          Google review URL
          <input
            type="url"
            placeholder="https://g.page/r/… (optional — leave blank if you don’t have one)"
            value={form.googleReviewUrl || ''}
            onChange={(e) => setForm({ ...form, googleReviewUrl: e.target.value })}
          />
        </label>

        <label className="field-label">
          Competitor notes
          <textarea
            rows={4}
            placeholder="What you know: name, neighborhood, what they post, prices they publish. Do not guess."
            value={form.competitorNotes || ''}
            onChange={(e) => setForm({ ...form, competitorNotes: e.target.value })}
          />
        </label>
        <p className="field-hint">Used in captions, Book Closer, and link-in-bio.</p>

        <label className="field-label">
          Partner org (optional)
          <input
            placeholder="jawsai911"
            value={form.partnerOrg}
            onChange={(e) => setForm({ ...form, partnerOrg: e.target.value })}
          />
        </label>
        <p className="field-hint">Connects SuperSite / agency provisioning without renaming the product.</p>

        <button type="submit" className="button button-dark">
          Save brand settings
        </button>
        {saved && (
          <div className="form-message">Brand kit saved for this browser. Cloud book picks it up on the next sync.</div>
        )}
      </form>

      <aside className="link-in-bio-preview">
        <h3>Link-in-bio preview</h3>
        <div className="bio-card">
          <strong>@{form.name.replace(/\s+/g, '').toLowerCase() || 'yoursalon'}</strong>
          <p>{form.brandTone}</p>
          <a
            className="button button-dark button-small"
            href={bookHref}
            target={bookHref !== '#' ? '_blank' : undefined}
            rel="noreferrer"
            onClick={(e) => {
              if (bookHref === '#') e.preventDefault()
            }}
          >
            Book now
          </a>
          <small>Powered by GlowUP</small>
          {form.partnerOrg === 'jawsai911' && <small className="partner-tag">Connected · JAWSAI911</small>}
        </div>
      </aside>
    </div>
  )
}
