import { useState } from 'react'
import './ConfigPanel.css'

export default function ConfigPanel({ onStart }) {
  const [domain, setDomain] = useState('')
  const [dryRun, setDryRun] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    const cleaned = domain.trim().replace(/^https?:\/\//i, '').replace(/\/$/, '')
    if (!cleaned || !cleaned.includes('.')) {
      setError('Enter a valid domain — e.g. stripe.com')
      return
    }
    onStart({ domain: cleaned, dryRun })
  }

  return (
    <div className="config-wrap">
      <div className="config-hero">
        <div className="pipeline-visual">
          {['Ocean.io', 'Prospeo', 'Email Enrich', 'Brevo'].map((s, i) => (
            <div key={s} className="pipeline-step">
              <div className="step-num">{i + 1}</div>
              <div className="step-name">{s}</div>
              {i < 3 && <div className="step-arrow">→</div>}
            </div>
          ))}
        </div>

        <h1 className="hero-title">One input.<br />Full outreach engine.</h1>
        <p className="hero-sub">
          Type a company domain. The pipeline finds lookalike companies, surfaces
          C-suite decision-makers, resolves their work emails, and sends personalized
          outreach — all automatically.
        </p>
      </div>

      <form className="config-form" onSubmit={handleSubmit}>
        <div className="domain-field">
          <div className="domain-prefix">company</div>
          <input
            type="text"
            placeholder="stripe.com"
            value={domain}
            onChange={e => { setDomain(e.target.value); setError('') }}
            className={`domain-input ${error ? 'error' : ''}`}
            autoComplete="off"
            autoFocus
            spellCheck={false}
          />
        </div>
        {error && <span className="err-msg">{error}</span>}

        <div className="dry-run-row">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={dryRun}
              onChange={e => setDryRun(e.target.checked)}
            />
            <span className="toggle-track"><span className="toggle-thumb" /></span>
            <span>Dry run <span className="muted">(find contacts but don't send emails)</span></span>
          </label>
        </div>

        <button type="submit" className="run-btn">
          <span className="run-icon">▶</span>
          Run Pipeline
        </button>
      </form>

      <div className="how-it-works">
        <div className="hiw-title">How it works</div>
        <div className="hiw-steps">
          <div className="hiw-step">
            <span className="hiw-num">1</span>
            <div>
              <strong>Ocean.io</strong>
              <p>Finds companies with similar firmographics to your seed domain</p>
            </div>
          </div>
          <div className="hiw-step">
            <span className="hiw-num">2</span>
            <div>
              <strong>Prospeo</strong>
              <p>Surfaces C-suite and VP-level decision-makers at each company</p>
            </div>
          </div>
          <div className="hiw-step">
            <span className="hiw-num">3</span>
            <div>
              <strong>Email Enrichment</strong>
              <p>Resolves each LinkedIn profile to a verified work email</p>
            </div>
          </div>
          <div className="hiw-step">
            <span className="hiw-num">4</span>
            <div>
              <strong>Brevo</strong>
              <p>Sends a personalized outreach email to every contact</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
