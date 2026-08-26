import { Link, createFileRoute } from '@tanstack/react-router'
import { useMemo } from 'react'
import { ArrowUpRight, Check } from 'lucide-react'
import { getAgent, statusLabel } from '../lib/glow-agents'
import { listChairMoments } from '../lib/chair-content'
import { listDrafts, listPendingDrafts, listReadyDrafts } from '../lib/draft-store'
import { buildTrendCards } from '../lib/trend-scout'

export const Route = createFileRoute('/dashboard/social/')({
  component: SocialPulse,
})

function SocialPulse() {
  const chairs = useMemo(() => listChairMoments(), [])
  const livePending = useMemo(() => listPendingDrafts(), [])
  const liveReady = useMemo(() => listReadyDrafts(), [])
  const liveDrafts = useMemo(() => listDrafts(), [])
  const trends = useMemo(() => buildTrendCards(), [])
  const chair = chairs[0]

  return (
    <div className="social-pulse">
      <section className="chair-lead">
        <span className="agent-chip">{getAgent('chair_content')?.name}</span>
        <h2>
          {chair
            ? `From the chair — ${chair.service}`
            : 'From the chair — no service on today’s book'}
        </h2>
        <p>
          {chair
            ? `${chair.stylist} at ${chair.time}. Draft a Reel from this live row. Consent before faces. Social will not name the guest.`
            : 'Add a Calendar appointment for today, then come back. We will not invent a chair moment.'}
        </p>
        <Link
          className="button button-dark"
          to="/dashboard/social/studio"
          search={{ from: 'chair', trend: undefined, campaign: undefined }}
        >
          {chair ? 'Draft this chair' : 'Open Studio'}
        </Link>
      </section>

      <div className="pulse-stats">
        <article>
          <span>Posts ready</span>
          <strong>{liveReady.length} in flight</strong>
          <Link to="/dashboard/social/schedule">
            Review schedule <ArrowUpRight size={14} />
          </Link>
        </article>
        <article>
          <span>On the book today</span>
          <strong>{chairs.length} chair{chairs.length === 1 ? '' : 's'}</strong>
          <Link to="/dashboard/calendar">
            Open calendar <ArrowUpRight size={14} />
          </Link>
        </article>
        <article>
          <span>Needs you</span>
          <strong>{livePending.length} for approval</strong>
          <Link to="/dashboard/concierge">
            Open queue <ArrowUpRight size={14} />
          </Link>
        </article>
      </div>

      <section className="pulse-section">
        <h2>Also this week</h2>
        <div className="pulse-ideas">
          {trends[0] && (
            <article>
              <span className="agent-chip">{getAgent('trend_scout')?.name}</span>
              <h3>{trends[0].title}</h3>
              <p>{trends[0].why}</p>
              <Link
                className="button button-cream button-small"
                to="/dashboard/social/studio"
                search={{ from: undefined, trend: trends[0].id, campaign: 'trend' }}
              >
                Draft this angle
              </Link>
            </article>
          )}
          <article>
            <span className="agent-chip">{getAgent('fill_the_book')?.name}</span>
            <h3>Rebook nudge — color refresh</h3>
            <p>Social teaser that pairs with your external booking link.</p>
            <Link className="button button-cream button-small" to="/dashboard/social/campaigns">
              Open campaign
            </Link>
          </article>
          <article>
            <span className="agent-chip">{getAgent('reputation')?.name}</span>
            <h3>Review asks — yesterday</h3>
            <p>Thank-you texts from real visits. Nothing sends until you tap Send.</p>
            <Link className="button button-cream button-small" to="/dashboard/social/campaigns">
              Open Reputation
            </Link>
          </article>
          <article>
            <span className="agent-chip">{getAgent('front_desk')?.name}</span>
            <h3>Reply to a comment</h3>
            <p>On-brand answer. You paste it back to Instagram or DMs. GlowUP does not post.</p>
            <Link className="button button-cream button-small" to="/dashboard/social/campaigns">
              Open Front Desk
            </Link>
          </article>
          <article>
            <span className="agent-chip">{getAgent('book_closer')?.name}</span>
            <h3>Close a hot comment</h3>
            <p>One booking ask from their words. Uses your real booking URL only.</p>
            <Link className="button button-cream button-small" to="/dashboard/social/campaigns">
              Open Book Closer
            </Link>
          </article>
          <article>
            <span className="agent-chip">{getAgent('shorts')?.name}</span>
            <h3>Hooks for Reels</h3>
            <p>Three first lines from a real menu service. No invented virality.</p>
            <Link className="button button-cream button-small" to="/dashboard/social/campaigns">
              Open Shorts
            </Link>
          </article>
          <article>
            <span className="agent-chip">{getAgent('retail_services')?.name}</span>
            <h3>Spotlight a menu item</h3>
            <p>One service from Brand. No invented price.</p>
            <Link className="button button-cream button-small" to="/dashboard/social/campaigns">
              Open Retail
            </Link>
          </article>
          <article>
            <span className="agent-chip">{getAgent('competitor_scout')?.name}</span>
            <h3>Competitor brief</h3>
            <p>From your notes only. No invented occupancy.</p>
            <Link className="button button-cream button-small" to="/dashboard/social/campaigns">
              Open Competitor Scout
            </Link>
          </article>
          <article>
            <span className="agent-chip">{getAgent('lead_scout')?.name}</span>
            <h3>Rank who’s already here</h3>
            <p>CRM + overdue book, scored on facts.</p>
            <Link className="button button-cream button-small" to="/dashboard/social/campaigns">
              Open Lead Scout
            </Link>
          </article>
          <article>
            <span className="agent-chip">{getAgent('local_seo')?.name}</span>
            <h3>Title, meta, GBP</h3>
            <p>Local copy from name, city, and menu.</p>
            <Link className="button button-cream button-small" to="/dashboard/social/campaigns">
              Open Local SEO
            </Link>
          </article>
        </div>
      </section>

      <section className="pulse-section">
        <h2>Approval & ready queue</h2>
        <div className="post-queue">
          {liveDrafts.length === 0 && (
            <p className="muted-copy">No Chair Content drafts yet. Use Draft this chair above.</p>
          )}
          {liveDrafts.map((post) => (
            <article key={post.id} className={`post-row status-${post.status}`}>
              <div>
                <strong>{post.sourceLabel}</strong>
                <p>{post.caption.slice(0, 90)}…</p>
                <small>
                  {getAgent(post.agentId)?.name} · {post.author} ({post.authorRole}) · {post.platforms.join(' · ')}
                </small>
              </div>
              <div className="post-row-meta">
                <span className="status-pill">{statusLabel(post.status)}</span>
                {post.status === 'pending_approval' && (
                  <Link className="button button-dark button-small" to="/dashboard/concierge">
                    Review
                  </Link>
                )}
                {post.status === 'ready' && (
                  <Link className="button button-cream button-small" to="/dashboard/social/schedule">
                    Assist post <Check size={14} />
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
