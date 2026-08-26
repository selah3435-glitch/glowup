import { useMemo, useState } from 'react'

/** Interactive after-hours booking ROI model for multi-stylist owners (marketing). */

function money(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

export function RoiCalculator() {
  const [missedCalls, setMissedCalls] = useState(12)
  const [ticket, setTicket] = useState(85)
  const [captureRate, setCaptureRate] = useState(45)

  const model = useMemo(() => {
    const weeklyRecovered = missedCalls * (captureRate / 100)
    const monthlyAppts = weeklyRecovered * 4.33
    const monthlyRevenue = monthlyAppts * ticket
    const yearlyRevenue = monthlyRevenue * 12
    return { weeklyRecovered, monthlyAppts, monthlyRevenue, yearlyRevenue }
  }, [missedCalls, ticket, captureRate])

  return (
    <section className="rd-roi" id="roi" aria-labelledby="roi-heading">
      <div className="rd-roi-inner">
        <div className="rd-value-head">
          <p className="rd-kicker">ROI · after-hours AI</p>
          <h2 id="roi-heading">
            What empty chair gaps
            <br />
            <em>are costing the floor.</em>
          </h2>
          <p>
            Modeled estimate for multi-stylist owners: if Glo chat captures a share of after-hours / missed-call
            demand onto your live book, here’s the revenue back on the floor.
          </p>
        </div>

        <div className="rd-roi-grid">
          <div className="rd-roi-controls">
            <label>
              Missed / after-hours inquiries per week
              <input
                type="range"
                min={2}
                max={40}
                value={missedCalls}
                onChange={(e) => setMissedCalls(Number(e.target.value))}
              />
              <strong>{missedCalls} / week</strong>
            </label>
            <label>
              Average service ticket ($)
              <input
                type="range"
                min={40}
                max={250}
                step={5}
                value={ticket}
                onChange={(e) => setTicket(Number(e.target.value))}
              />
              <strong>${ticket}</strong>
            </label>
            <label>
              Share Glo could capture (%)
              <input
                type="range"
                min={15}
                max={70}
                step={5}
                value={captureRate}
                onChange={(e) => setCaptureRate(Number(e.target.value))}
              />
              <strong>{captureRate}%</strong>
            </label>
            <p className="rd-roi-note">
              Model only — not a guarantee. Adjust to your floor. Glo chat (beta) books after hours; voice coming soon.
            </p>
          </div>

          <div className="rd-roi-results" aria-live="polite">
            <div className="rd-roi-stat">
              <span>Recovered appointments / mo</span>
              <strong>{model.monthlyAppts.toFixed(0)}</strong>
            </div>
            <div className="rd-roi-stat featured">
              <span>Modeled monthly revenue</span>
              <strong>{money(model.monthlyRevenue)}</strong>
            </div>
            <div className="rd-roi-stat">
              <span>Modeled yearly revenue</span>
              <strong>{money(model.yearlyRevenue)}</strong>
            </div>
            <p className="rd-roi-formula">
              {missedCalls}/wk × {captureRate}% × 4.33 wks × ${ticket} ticket
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
