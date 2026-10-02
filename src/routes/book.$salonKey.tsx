import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { BrandLogo } from '../components/BrandLogo'
import { AiReceptionist } from '../components/AiReceptionist'
import { fetchGloDesk, type GloDeskPublic } from '../lib/glo-desk-client'

export const Route = createFileRoute('/book/$salonKey')({
  component: PublicBookPage,
  head: () => ({
    meta: [
      { title: 'Book with Glo · GlowUP.' },
      {
        name: 'description',
        content: 'After-hours Glo chat for this studio. Phone voice is not live yet.',
      },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
})

function PublicBookPage() {
  const { salonKey } = Route.useParams()
  const [phase, setPhase] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading')
  const [desk, setDesk] = useState<GloDeskPublic | null>(null)

  useEffect(() => {
    let alive = true
    setPhase('loading')
    void fetchGloDesk(salonKey).then((r) => {
      if (!alive) return
      if (r.ok && (r.studioName || r.services.length || r.hours)) {
        setDesk(r)
        setPhase('ready')
        return
      }
      const unpublished = /not found|not published|push/i.test(r.error || '')
      setDesk(null)
      setPhase(unpublished || !r.error ? 'missing' : /network|unavailable|HTTP 0/i.test(r.error) ? 'error' : 'missing')
    })
    return () => {
      alive = false
    }
  }, [salonKey])

  const salonName = desk?.studioName || 'Studio'
  const hours = desk?.hours || ''
  const services = desk?.services || []

  return (
    <main className="book-desk-page">
      <header className="book-desk-nav">
        <BrandLogo href="/" light compact />
        <Link to="/" className="muted-copy">
          GlowUP.
        </Link>
      </header>

      <div className="book-desk-body">
        {phase === 'loading' && (
          <>
            <div className="welcome-row">
              <div>
                <p>GLO · PUBLIC DESK</p>
                <h1>Opening this floor</h1>
                <span>Checking the cloud book…</span>
              </div>
            </div>
            <section className="scan-card">
              <p className="muted-copy">Glo is looking up this studio’s published hours and menu.</p>
            </section>
          </>
        )}

        {phase === 'missing' && (
          <>
            <div className="welcome-row">
              <div>
                <p>GLO · CLOUD BOOK</p>
                <h1>Not on the cloud yet</h1>
                <span>This link is waiting for a published book.</span>
              </div>
            </div>
            <section className="scan-card">
              <h3>Studio unpublished</h3>
              <p className="muted-copy">
                This studio has not published a cloud book yet. Owner: Dashboard → Ops → Push to cloud.
              </p>
              <Link className="button button-dark" to="/login">
                Owner sign in
              </Link>
            </section>
          </>
        )}

        {phase === 'error' && (
          <>
            <div className="welcome-row">
              <div>
                <p>GLO · PUBLIC DESK</p>
                <h1>Desk is quiet</h1>
                <span>Couldn’t reach the cloud book.</span>
              </div>
            </div>
            <section className="scan-card">
              <p className="muted-copy">
                This studio has not published a cloud book yet. Owner: Dashboard → Ops → Push to cloud.
              </p>
            </section>
          </>
        )}

        {phase === 'ready' && desk && (
          <>
            <div className="welcome-row">
              <div>
                <p>GLO · THIS FLOOR</p>
                <h1>{salonName}</h1>
                <span>{hours || 'After-hours Glo books this floor in chat.'}</span>
              </div>
            </div>

            <section className="scan-card">
              <h3>Hours</h3>
              <p className="muted-copy">{hours || 'Hours are not published yet. Glo can still hold a time here.'}</p>
            </section>

            <section className="scan-card">
              <h3>The menu</h3>
              {services.length ? (
                <ul className="book-desk-menu">
                  {services.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              ) : (
                <p className="muted-copy">No services published yet. Ask Glo, or the owner can push the menu from Ops.</p>
              )}
            </section>

            <section className="scan-card book-desk-glo">
              <h3>Glo for {salonName}</h3>
              <p className="muted-copy">Chat books this studio after hours. Phone voice is not live yet.</p>
              <AiReceptionist
                salonKey={salonKey}
                salonName={salonName}
                services={services}
                hours={hours}
                variant="tenant"
              />
            </section>
          </>
        )}
      </div>
    </main>
  )
}
