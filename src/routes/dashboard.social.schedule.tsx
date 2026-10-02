import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import {
  ASSIST_PLATFORMS,
  listDrafts,
  markDraftPosted,
  scheduleDraft,
  type AssistPlatform,
  type StudioDraft,
} from '../lib/draft-store'

export const Route = createFileRoute('/dashboard/social/schedule')({
  component: SocialSchedule,
})

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

const ASSIST_URL: Record<AssistPlatform, string> = {
  facebook: 'https://www.facebook.com/',
  instagram: 'https://www.instagram.com/',
  tiktok: 'https://www.tiktok.com/upload',
}

function dayOf(draft: StudioDraft): (typeof WEEKDAYS)[number] {
  const iso = draft.publishOn
  const date = iso ? new Date(`${iso}T12:00:00`) : new Date(draft.createdAt)
  return WEEKDAYS[date.getDay()]
}

function canAssist(draft: StudioDraft) {
  return (
    draft.status === 'approved' ||
    draft.status === 'ready' ||
    draft.status === 'scheduled' ||
    draft.status === 'marked_posted'
  )
}

function SocialSchedule() {
  const [toast, setToast] = useState('')
  const [tick, setTick] = useState(0)
  const drafts = listDrafts()
  void tick

  const byDay: Record<string, StudioDraft[]> = {
    Mon: [],
    Tue: [],
    Wed: [],
    Thu: [],
    Fri: [],
    Sat: [],
    Sun: [],
  }
  for (const draft of drafts) {
    const wd = dayOf(draft)
    if (byDay[wd]) byDay[wd].push(draft)
  }

  const queue = drafts.filter(canAssist)

  function note(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(''), 3200)
  }

  function refresh() {
    setTick((n) => n + 1)
  }

  async function assistPost(draft: StudioDraft, platform: AssistPlatform) {
    if (!draft.caption.trim()) {
      note('This draft has no caption yet.')
      return
    }
    try {
      await navigator.clipboard?.writeText(draft.caption)
    } catch {
      /* owner can still copy from the card */
    }
    const saved = markDraftPosted(draft.id, platform)
    refresh()
    note(
      saved
        ? `${platform} caption copied. Paste it in the app — marked posted on this wall.`
        : 'Could not mark that draft. Approve it in Concierge first.',
    )
    if (saved) window.open(ASSIST_URL[platform], '_blank', 'noopener,noreferrer')
  }

  function placeOnDay(draft: StudioDraft, publishOn: string) {
    const saved = scheduleDraft(draft.id, publishOn)
    refresh()
    note(saved ? `Scheduled ${publishOn}.` : 'Pick a date after the draft is approved.')
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
        Assist publish only. Copy the approved caption, paste it in Facebook, Instagram, or TikTok, and the wall
        remembers the platform. Auto-post is not live.
      </p>

      <div className="week-wall">
        {DAYS.map((day) => (
          <div key={day} className={`day-col ${byDay[day].length ? '' : 'day-gap'}`}>
            <header>{day}</header>
            {byDay[day].length === 0 ? (
              <p className="gap-label">Open</p>
            ) : (
              byDay[day].map((post) => (
                <article key={post.id}>
                  <strong>{post.service || 'Draft'}</strong>
                  <span>{post.status.replace(/_/g, ' ')}</span>
                  <small>
                    {(post.postedPlatforms || []).length
                      ? `Posted: ${post.postedPlatforms?.join(', ')}`
                      : post.publishOn || post.createdAt.slice(0, 10)}
                  </small>
                </article>
              ))
            )}
          </div>
        ))}
      </div>

      <section className="assist-panel">
        <h2>Ready to post (assist)</h2>
        <p>Place an approved draft on a day, then open one network at a time.</p>
        {queue.length === 0 ? (
          <p className="muted-copy">No approved drafts yet. Write one in Studio. Stylist drafts wait in Concierge.</p>
        ) : (
          <ul className="ops-outbox">
            {queue.map((draft) => (
              <li key={draft.id}>
                <div>
                  <strong>{draft.service || 'Draft'}</strong>
                  <small>
                    {draft.status.replace(/_/g, ' ')}
                    {draft.publishOn ? ` · ${draft.publishOn}` : ''} · {draft.author}
                  </small>
                  <p>
                    {draft.caption.slice(0, 180)}
                    {draft.caption.length > 180 ? '…' : ''}
                  </p>
                </div>
                <div className="ops-msg-actions">
                  <label>
                    Day
                    <input
                      type="date"
                      value={draft.publishOn || ''}
                      onChange={(e) => placeOnDay(draft, e.target.value)}
                    />
                  </label>
                  {ASSIST_PLATFORMS.map((platform) => {
                    const done = draft.postedPlatforms?.includes(platform)
                    return (
                      <button
                        key={platform}
                        type="button"
                        className={platform === 'facebook' ? 'button button-dark' : 'button button-cream'}
                        onClick={() => void assistPost(draft, platform)}
                      >
                        {done ? `${platform} posted` : `Post to ${platform}`}
                      </button>
                    )
                  })}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
