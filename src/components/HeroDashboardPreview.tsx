/** Marketing-only Overview mock — not connected to real data/auth */

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

export function HeroDashboardPreview() {
  return (
    <div id="hero-dashboard" className="rd-dash-preview" aria-label="Owner home preview, empty until a Floor is live">
      <div className="rd-dash-chrome">
        <span className="rd-dash-badge">Owner home · empty until a Floor is live</span>
        <aside className="rd-dash-side">
          <div className="rd-dash-logo">GlowUP.</div>
          <div className="rd-dash-studio">
            <small>MY BUSINESS</small>
            <strong>Your floor</strong>
          </div>
          <nav className="rd-dash-nav">
            <span className="active">Overview</span>
            <span>Calendar</span>
            <span>Clients</span>
            <span>Glo</span>
          </nav>
        </aside>
        <div className="rd-dash-main">
          <header className="rd-dash-welcome">
            <p>OWNER HOME</p>
            <h3>Welcome.</h3>
            <span>Empty until a Floor is live</span>
          </header>

          <div className="rd-dash-revenue" aria-label="After-hours inquiries to booked deposits this week">
            <div className="rd-dash-rhythm-head">
              <span>After-hours inquiries → booked deposits this week</span>
            </div>
            <div className="rd-dash-rev-stats">
              <div>
                <span>After-hours inquiries</span>
                <strong>—</strong>
                <em>Not on this site yet</em>
              </div>
              <div>
                <span>Booked deposits this week</span>
                <strong>—</strong>
                <em>Not on this site yet</em>
              </div>
            </div>
            <div className="rd-dash-welcome">
              <span>
                Not a modeled range. This fills from a live Floor book — we do not publish fake occupancy or fake weeks.
              </span>
            </div>
            <div
              className="rd-dash-rhythm"
              role="img"
              aria-label="Empty after-hours and deposit slots until a Floor is live"
            >
              <div className="rd-dash-rhythm-head">
                <span>After-hours / deposits</span>
                <small>Mon – Sun · empty</small>
              </div>
              <div className="rd-dash-bars">
                {DAY_LABELS.map((label, i) => (
                  <div key={`${label}-${i}`} className="rd-dash-bar-col">
                    <i style={{ height: '4px', opacity: 0.28 }} />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rd-dash-metrics">
            <article>
              <span>Today’s book</span>
              <strong>—</strong>
            </article>
            <article>
              <span>After-hours</span>
              <strong>—</strong>
            </article>
            <article>
              <span>Returning</span>
              <strong>—</strong>
            </article>
          </div>
          <div className="rd-dash-upcoming">
            <div className="rd-dash-up-head">
              <strong>Upcoming</strong>
              <em>Not on this site yet</em>
            </div>
            <ul>
              <li>—</li>
            </ul>
          </div>
          <div className="rd-dash-glo-chip">Glo chat · books the live calendar after hours</div>
        </div>
      </div>
    </div>
  )
}
