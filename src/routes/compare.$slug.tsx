import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'
import { BrandLogo } from '../components/BrandLogo'
import { trackEvent } from '../lib/analytics'
import {
  COMPARE_PAGES,
  getComparePage,
  otherComparePages,
  type ComparePage,
} from '../lib/compare-salons'
import { breadcrumbJsonLd, faqJsonLd, FLOOR_PILOT_HREF, marketingHead } from '../lib/marketing-meta'

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
    if (!page) {
      return marketingHead({ title, description, path: '/' })
    }
    return marketingHead({
      title,
      description,
      path: `/compare/${page.slug}`,
      jsonLd: [
        breadcrumbJsonLd([
          { name: 'GlowUP.', path: '/' },
          { name: `vs ${page.competitor}`, path: `/compare/${page.slug}` },
        ]),
        faqJsonLd(page.faqs, `https://glowupbeautysolutions.com/compare/${page.slug}#faq`),
      ],
    })
  },
  notFoundComponent: CompareNotFound,
  component: ComparePageView,
})

function ComparePageView() {
  const { page } = Route.useLoaderData()
  const others = otherComparePages(page.slug)

  return (
    <main className="marketing-page rhode-look segment-page compare-page">
      <CompareChrome ctaLocation="compare_nav" competitor={page.competitor} />

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
            href={FLOOR_PILOT_HREF}
            onClick={() =>
              trackEvent('join_beta_click', { plan: 'floor', location: 'compare_hero', slug: page.slug })
            }
          >
            Start Floor pilot <ChevronRight size={16} />
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
          Floor is $149 with 30 days on the house. Glo included. Keep your current book in parallel for 14 days.
        </p>
        <div className="rd-cta-row">
          <a
            className="rd-btn-primary"
            href={FLOOR_PILOT_HREF}
            onClick={() =>
              trackEvent('join_beta_click', { plan: 'floor', location: 'compare_cta', slug: page.slug })
            }
          >
            Start Floor pilot <ChevronRight size={16} />
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
          <Link to="/ai-receptionist">AI receptionist</Link>
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

function CompareChrome({ ctaLocation, competitor }: { ctaLocation: string; competitor?: string }) {
  return (
    <header className="rd-nav">
      <div className="rd-nav-brand">
        <BrandLogo href="/" showSlogan={false} />
        <span className="rd-beta-chip">Open beta</span>
      </div>
      <nav className="rd-nav-links" aria-label="Primary">
        <Link to="/">Home</Link>
        <Link to="/for-floors">Floors</Link>
        <Link to="/ai-receptionist">Glo</Link>
        <a
          className="rd-nav-cta"
          href={FLOOR_PILOT_HREF}
          onClick={() =>
            trackEvent('join_beta_click', {
              plan: 'floor',
              location: ctaLocation,
              ...(competitor ? { competitor } : {}),
            })
          }
        >
          Start Floor pilot
        </a>
      </nav>
    </header>
  )
}

function CompareAlso({ page, others }: { page: ComparePage; others: ComparePage[] }) {
  return (
    <section className="compare-also">
      <p className="rd-kicker">Also compare</p>
      <p>GlowUP. vs {page.competitor} is one stack. Same offer on the other pages:</p>
      <ul className="segment-list">
        {others.map((o) => (
          <li key={o.slug}>
            <a href={`/compare/${o.slug}`}>GlowUP. vs {o.competitor}</a>
          </li>
        ))}
        <li>
          <Link to="/ai-receptionist">AI receptionist for salons</Link>
        </li>
      </ul>
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
          Published comparisons: {Object.values(COMPARE_PAGES).map((p) => p.competitor).join(', ')}. Unknown
          names do not get a placeholder page.
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
