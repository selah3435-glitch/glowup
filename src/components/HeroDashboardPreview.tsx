/** Marketing-only Overview mock — not connected to real data/auth */

const WEEK_RHYTHM = [42, 58, 51, 72, 64, 88, 76] // Mon–Sun relative heights (%)
const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

export function HeroDashboardPreview() {
  return (
    <div id="hero-dashboard" className="rd-dash-preview" aria-label="Stylist dashboard preview">
      <div className="rd-dash-chrome">
        <span className="rd-dash-badge">Stylist dashboard · beta preview</span>
        <aside className="rd-dash-side">
          <div className="rd-dash-logo">GlowUP.</div>
          <div className="rd-dash-studio">
            <small>MY BUSINESS</small>
            <strong>Lumen Collective</strong>
          </div>
          <nav className="rd-dash-nav">
            <span className="active">Overview</span>
            <span>Calendar</span>
            <span>Clients</span>
            <span>Leads</span>
            <span>Glo</span>
          </nav>
        </aside>
        <div className="rd-dash-main">
          <header className="rd-dash-welcome">
            <p>OWNER HOME · FLOOR PLAN</p>
            <h3>Welcome, Amelia.</h3>
            <span>Live book · Glo chat · CRM online</span>
          </header>

          <div className="rd-dash-revenue" aria-label="Revenue rhythm">
            <div className="rd-dash-rev-stats">
              <div>
                <span>Today’s revenue</span>
                <strong>$2,840</strong>
                <em className="up">+18% vs last Wed</em>
              </div>
              <div>
                <span>This week</span>
                <strong>$14,620</strong>
                <em className="up">+12% vs last week</em>
              </div>
            </div>
            <div className="rd-dash-rhythm" role="img" aria-label="This week revenue rhythm chart">
              <div className="rd-dash-rhythm-head">
                <span>This week’s rhythm</span>
                <small>Mon – Sun</small>
              </div>
              <div className="rd-dash-bars">
                {WEEK_RHYTHM.map((h, i) => (
                  <div key={`${DAY_LABELS[i]}-${i}`} className="rd-dash-bar-col">
                    <i
                      className={i === 5 ? 'peak' : i === 2 ? 'today' : undefined}
                      style={{ height: `${h}%` }}
                    />
                    <span>{DAY_LABELS[i]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rd-dash-metrics">
            <article>
              <span>Today’s book</span>
              <strong>
                12 <small>live</small>
              </strong>
            </article>
            <article>
              <span>After-hours AI</span>
              <strong>4</strong>
            </article>
            <article>
              <span>Returning</span>
              <strong>78%</strong>
            </article>
          </div>
          <div className="rd-dash-upcoming">
            <div className="rd-dash-up-head">
              <strong>Upcoming</strong>
              <em>Glo chat booked 2 after hours</em>
            </div>
            <ul>
              <li>
                <b>Maya R.</b> · Balayage · 10:00 · Noor
              </li>
              <li>
                <b>Jordan K.</b> · Cut + gloss · 11:30 · Amelia
              </li>
              <li>
                <b>Priya S.</b> · Blowout · 1:00 · Glo hold
              </li>
            </ul>
          </div>
          <div className="rd-dash-glo-chip">Glo chat · books the live calendar after hours</div>
        </div>
      </div>
    </div>
  )
}
