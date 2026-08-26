import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { ArrowUpRight, Bot, Check, X } from 'lucide-react'
import { buildDemoConcierge, DEMO_POSTS, GLOW_AGENTS, getAgent, statusLabel } from '../lib/glow-agents'
import { loadSalonContext } from '../lib/demo-salon'
import { listPendingDrafts, setDraftStatus, type StudioDraft } from '../lib/draft-store'
import type { DemoPost } from '../lib/glow-agents'

export const Route = createFileRoute('/dashboard/concierge')({
  component: GlowConcierge,
})

function GlowConcierge() {
  const salon = useMemo(() => loadSalonContext(), [])
  const [cards, setCards] = useState(() => buildDemoConcierge(salon.name, salon.externalBookingUrl))
  const [approvals, setApprovals] = useState<(StudioDraft | DemoPost)[]>(() => {
    const live = listPendingDrafts()
    return live.length ? live : DEMO_POSTS.filter((p) => p.status === 'pending_approval')
  })
  const [toast, setToast] = useState('')

  function dismiss(id: string) {
    setCards((c) => c.filter((x) => x.id !== id))
  }

  function approve(id: string) {
    setDraftStatus(id, 'approved')
    setApprovals((list) => list.filter((p) => p.id !== id))
    setToast('Approved. Draft moved to ready / schedule for assist publish.')
    window.setTimeout(() => setToast(''), 2800)
  }

  function requestChanges(id: string) {
    setDraftStatus(id, 'draft')
    setApprovals((list) => list.filter((p) => p.id !== id))
    setToast('Sent back to draft. Open Studio to edit.')
    window.setTimeout(() => setToast(''), 2800)
  }

  return (
    <div className="concierge-module">
      {toast && (
        <div className="toast">
          <span className="toast-check">✓</span>
          {toast}
        </div>
      )}

      <div className="concierge-hero">
        <div className="insight-icon">
          <Bot size={22} />
        </div>
        <div>
          <p className="eyebrow-inline">GLOW CONCIERGE</p>
          <h1>Your agents are ready, {salon.name}.</h1>
          <p>
            Glow Agents draft content, trends, rebooks, and reviews. You approve the brand. Connected to JAWSAI911 systems DNA —
            branded as GlowUP.
          </p>
        </div>
      </div>

      <section className="concierge-section">
        <h2>Needs your approval</h2>
        {approvals.length === 0 ? (
          <p className="muted-copy">No stylist drafts waiting. Enjoy the quiet.</p>
        ) : (
          <div className="approval-list">
            {approvals.map((post) => (
              <article key={post.id}>
                <div>
                  <strong>{post.sourceLabel}</strong>
                  <p>{post.caption}</p>
                  <small>
                    {post.author} · {getAgent(post.agentId)?.name} · {statusLabel(post.status)}
                  </small>
                </div>
                <div className="approval-actions">
                  <button type="button" className="button button-dark button-small" onClick={() => approve(post.id)}>
                    <Check size={14} /> Approve
                  </button>
                  <button type="button" className="button button-cream button-small" onClick={() => requestChanges(post.id)}>
                    <X size={14} /> Request edit
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="concierge-section">
        <h2>Suggestions</h2>
        <div className="concierge-cards">
          {cards.map((card) => (
            <article key={card.id}>
              <span className="agent-chip">{getAgent(card.agentId)?.name}</span>
              <h3>{card.title}</h3>
              <p>{card.body}</p>
              <div className="card-actions">
                <a className="button button-dark button-small" href={card.actionHref}>
                  {card.actionLabel} <ArrowUpRight size={14} />
                </a>
                <button type="button" className="text-dismiss" onClick={() => dismiss(card.id)}>
                  Dismiss
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="concierge-section">
        <h2>Glow Agents</h2>
        <div className="agents-grid">
          {GLOW_AGENTS.map((agent) => (
            <article key={agent.id}>
              <strong>{agent.name}</strong>
              <span>{agent.tagline}</span>
              <p>{agent.description}</p>
            </article>
          ))}
        </div>
        <p className="partner-footnote">Built as GlowUP · systems DNA from JAWSAI911</p>
      </section>
    </div>
  )
}
