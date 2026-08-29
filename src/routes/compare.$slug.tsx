import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'
import { BrandLogo } from '../components/BrandLogo'
import { trackEvent } from '../lib/analytics'
import {
  getComparePage,
  otherComparePages,
  type ComparePage,
} from '../lib/compare-salons'

const TRIAL = '/login?next=%2Fonboarding'

export const Route = createFileRoute('/compare/$slug')({
  loader: ({ params }) => {
    const page = getComparePage(params.slug)
    if (!page) throw notFound()
    return { page }
  },
  head: ({ loaderData, params }) => {
    const page = loaderData?.page ?? getComparePage(params.slug)
    const title = page?.seoTitle ?? 'Compare | GlowUP.'
    const description =
      page?.seoDescription ??
      'Compare GlowUP. salon OS with booking and marketplace tools. Open beta.'
    const canonical = page
      ? `https://glowupbeautysolutions.com/compare/${page.slug}`
      : 'https://glowupbeautysolutions.com/'
    return {
      meta: [{ title }, { name: 'description', content: description }],
      links: [{ rel: 'canonical', href: canonical }],
    }
  },
  notFoundComponent: CompareNotFound,
  component: ComparePageView,
})

function ComparePageView() {
  const { page } = Route.useLoaderData()
  const others = otherComparePages(page.slug)
  const faqJson = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: page.faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  })

  return (
    <main className="marketing-page rhode-look segment-page compare-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: faqJson }} />
      <CompareChrome ctaLocation="compare_nav" />

      <section className="segment-hero">
        <p className="rd-kicker">{page.kicker}</p>
        <h1>
          {page.headline}
          <br />
          <em>{page.headlineEm}</em>
        </h1>
        <p className="rd-lede compare-answer">{page.directAnswer}</p>
        <div className="rd-cta-row">
          <a
            className="rd-btn-primary"
            href={TRIAL}
            onClick={() => trackEvent('join_beta_click', { location: 'compare_hero', slug: page.slug })}
          >
            Join the beta <ChevronRight size={16} />
          </a>
          <a className="rd-btn-ghost" href={page.competitorSite} target="_blank" rel="noreferrer">
            {page.competitor} site
          </a>
        </div>
      </section>

      <section className="compare-body">
        <p className="compare-who">{page.whoTheyAre}</p>

        <div className="compare-table-wrap">
          <table className="compare-table">
            <caption>GlowUP. vs {page.competitor}</caption>
            <thead>
              <tr>
                <th scope="col">Capability</th>
                <th scope="col">GlowUP.</th>
                <th scope="col">{page.competitor}</th>
              </tr>
            </thead>
            <tbody>
              {page.rows.map((row) => (
                <tr key={row.id}>
                  <th scope="row">{row.label}</th>
                  <td>{row.glowup}</td>
                  <td>{row.them}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="compare-split">
          <article>
            <h2>Where GlowUP. is the better pick</h2>
            <ul className="segment-list">
              {page.glowupWins.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <article>
            <h2>Where {page.competitor} still wins</h2>
            <ul className="segment-list">
              {page.theyWin.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </div>

        <p className="segment-note">
          Facts from public product pages. Competitor rates change — check their site. We do not invent
          occupancy or GlowUP. customer counts. Open beta.
        </p>
      </section>

      <section className="compare-faq" id="faq">
        <p className="rd-kicker">FAQ</p>
        <h2>GlowUP. vs {page.competitor}</h2>
        {page.faqs.map((f) => (
          <article key={f.q}>
            <h3>{f.q}</h3>
            <p>{f.a}</p>
          </article>
        ))}
      </section>

      <section className="rd-final">
        <h2>
          Same OS from one chair
          <br />
          <em>to a multi-location floor.</em>
        </h2>
        <p>
          Solo $39 · Floor $149 · Brand $299+/location. Glo included. Voice coming soon.
        </p>
        <div className="rd-cta-row">
          <a
            className="rd-btn-primary"
            href={TRIAL}
            onClick={() => trackEvent('join_beta_click', { location: 'compare_cta', slug: page.slug })}
          >
            Start onboarding <ChevronRight size={16} />
          </a>
          <Link className="rd-btn-ghost" to="/for-floors">
            Multi-stylist floors
          </Link>
        </div>
      </section>

      <CompareAlso page={page} others={others} />

      <footer className="rd-footer">
        <BrandLogo href="/" showSlogan />
        <nav className="rd-footer-nav">
          <Link to="/">Home</Link>
          <Link to="/for-floors">Floors</Link>
          <Link to="/for-solo">Solo</Link>
          {others.map((o) => (
            <a key={o.slug} href={`/compare/${o.slug}`}>
              vs {o.competitor}
            </a>
          ))}
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
        </nav>
        <span className="rd-footer-copy">© 2026 GlowUP. · Open beta</span>
      </footer>
    </main>
  )
}

function CompareChrome({ ctaLocation }: { ctaLocation: string }) {
  return (
    <header className="rd-nav">
      <div className="rd-nav-brand">
        <BrandLogo href="/" showSlogan={false} />
        <span className="rd-beta-chip">Open beta</span>
      </div>
      <nav className="rd-nav-links" aria-label="Primary">
        <Link to="/">Home</Link>
        <Link to="/for-floors">Floors</Link>
        <Link to="/for-solo">Solo</Link>
        <a
          className="rd-nav-cta"
          href={TRIAL}
          onClick={() => trackEvent('join_beta_click', { location: ctaLocation })}
        >
          Join the beta
        </a>
      </nav>
    </header>
  )
}

function CompareAlso({ page, others }: { page: ComparePage; others: ComparePage[] }) {
  return (
    <section className="compare-also">
      <p className="rd-kicker">Also compare</p>
      <p>
        GlowUP. vs {page.competitor} is one stack. Also see{' '}
        {others.map((o, i) => (
          <span key={o.slug}>
            <a href={`/compare/${o.slug}`}>vs {o.competitor}</a>
            {i < others.length - 1 ? ' and ' : '.'}
          </span>
        ))}
      </p>
    </section>
  )
}

function CompareNotFound() {
  return (
    <main className="marketing-page rhode-look segment-page compare-page">
      <CompareChrome ctaLocation="compare_404" />
      <section className="segment-hero">
        <p className="rd-kicker">404</p>
        <h1>
          No comparison
          <br />
          <em>for that name.</em>
        </h1>
        <p className="rd-lede">
          We publish GlowUP. vs Vagaro, Gloss Genius, and Fresha only. Unknown slugs do not get a
          placeholder page.
        </p>
        <div className="rd-cta-row">
          <Link className="rd-btn-primary" to="/">
            Home <ChevronRight size={16} />
          </Link>
          <a className="rd-btn-ghost" href="/compare/vagaro">
            vs Vagaro
          </a>
        </div>
      </section>
    </main>
  )
}
