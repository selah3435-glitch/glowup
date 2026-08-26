import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { listDrafts, listReadyDrafts, type StudioDraft } from '../lib/draft-store'

export const Route = createFileRoute('/dashboard/social/schedule')({
  component: SocialSchedule,
})

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

function SocialSchedule() {
  const [toast, setToast] = useState('')
  const drafts = useMemo(() => listDrafts(), [])
  const ready = useMemo(() => listReadyDrafts(), [])
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const byDay = useMemo(() => {
    const map: Record<string, StudioDraft[]> = {
      Mon: [],
      Tue: [],
      Wed: [],
      Thu: [],
      Fri: [],
      Sat: [],
      Sun: [],
    }
    for (const d of drafts) {
      const wd = WEEKDAYS[new Date(d.createdAt).getDay()]
      if (map[wd]) map[wd].push(d)
    }
    return map
  }, [drafts])

  function assistPost(platform: 'facebook' | 'instagram') {
    const urls = {
      facebook: 'https://www.facebook.com/',
      instagram: 'https://www.instagram.com/',
    }
    const caption = ready[0]?.caption || drafts[0]?.caption || ''
    if (!caption) {
      setToast('No live drafts yet. Write one in Studio or Campaigns first.')
      window.setTimeout(() => setToast(''), 3200)
      return
    }
    void navigator.clipboard?.writeText(caption)
    setToast(`Caption copied. Opening ${platform} — paste & publish (assist mode).`)
    window.setTimeout(() => setToast(''), 3200)
    window.open(urls[platform], '_blank', 'noopener,noreferrer')
  }

  function markPosted() {
    setToast('Marked as posted. Full tracking lands with auto-publish phase.')
    window.setTimeout(() => setToast(''), 2800)
  }

  return (
    <div className="schedule-module">
      {toast && (
        <div className="toast">
          <span className="toast-check">✓</span>
          {toast}
        </div>
      )}

      <p className="muted-copy">
        Live drafts from Studio / Campaigns — not demo posts. Copy a caption, publish on the app, then mark posted.
        Auto-post is still next.
      </p>

      <div className="week-wall">
        {days.map((day) => (
          <div key={day} className={`day-col ${byDay[day].length ? '' : 'day-gap'}`}>
            <header>{day}</header>
            {byDay[day].length === 0 ? (
              <p className="gap-label">Open</p>
            ) : (
              byDay[day].map((post) => (
                <article key={post.id}>
                  <strong>{post.service || 'Draft'}</strong>
                  <span>{post.status.replace(/_/g, ' ')}</span>
                  <small>{post.sourceLabel || post.createdAt.slice(0, 10)}</small>
                </article>
              ))
            )}
          </div>
        ))}
      </div>

      <section className="assist-panel">
        <h2>Ready to post (assist)</h2>
        <p>Copy caption, open the app, then mark posted so your calendar stays honest.</p>
        <div className="assist-actions">
          <button type="button" className="button button-dark" onClick={() => assistPost('facebook')}>
            Post to Facebook
          </button>
          <button type="button" className="button button-cream" onClick={() => assistPost('instagram')}>
            Post to Instagram
          </button>
          <button type="button" className="button button-cream" onClick={markPosted}>
            Mark as posted
          </button>
        </div>
      </section>
    </div>
  )
}
