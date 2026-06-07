import { useState } from 'react'
import './ConfigPanel.css'

const FIELDS = [
  { key: 'domain', label: 'Seed Domain', placeholder: 'stripe.com', type: 'text', hint: 'Company you already know is a strong customer' },
  { key: 'ocean', label: 'Ocean.io API Key', placeholder: 'oc_...', type: 'password', hint: 'From ocean.io dashboard' },
  { key: 'prospeo', label: 'Prospeo API Key', placeholder: 'pro_...', type: 'password', hint: 'From app.prospeo.io/api' },
  { key: 'brevo', label: 'Brevo API Key', placeholder: 'xkeysib-...', type: 'password', hint: 'From app.brevo.com/settings/keys/api' },
  { key: 'senderEmail', label: 'Sender Email', placeholder: 'you@yourdomain.com', type: 'email', hint: 'Must be verified sender in Brevo' },
  { key: 'senderName', label: 'Sender Name', placeholder: 'John Smith', type: 'text', hint: 'Your name shown in outreach emails' },
]

export default function ConfigPanel({ onStart }) {
  const [form, setForm] = useState({
    domain: '', ocean: '', prospeo: '', brevo: '', senderEmail: '', senderName: '',
    dryRun: false,
  })
  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!form.domain || !form.domain.includes('.')) e.domain = 'Enter a valid domain (e.g. stripe.com)'
    if (!form.ocean) e.ocean = 'Required'
    if (!form.prospeo) e.prospeo = 'Required'
    if (!form.brevo) e.brevo = 'Required'
    if (!form.senderEmail || !form.senderEmail.includes('@')) e.senderEmail = 'Enter a valid email'
    if (!form.senderName) e.senderName = 'Required'
    return e
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    onStart(form)
  }

  return (
    <div className="config-wrap">
      <div className="config-hero">
        <div className="pipeline-visual">
          {['Ocean.io', 'Prospeo', 'Prospeo Enrich', 'Brevo'].map((s, i) => (
            <div key={s} className="pipeline-step">
              <div className="step-num">{i + 1}</div>
              <div className="step-name">{s}</div>
              {i < 3 && <div className="step-arrow">→</div>}
            </div>
          ))}
        </div>
        <h1 className="hero-title">One input. Four stages.<br />Full outreach engine.</h1>
        <p className="hero-sub">Enter a seed domain. The pipeline finds lookalikes, surfaces decision-makers, resolves their emails, and sends personalized outreach — automatically.</p>
      </div>

      <form className="config-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          {FIELDS.map(f => (
            <div className="field-group" key={f.key}>
              <label>{f.label}</label>
              <input
                type={f.type}
                placeholder={f.placeholder}
                value={form[f.key]}
                onChange={e => { setForm(p => ({ ...p, [f.key]: e.target.value })); setErrors(p => ({ ...p, [f.key]: '' })) }}
                className={errors[f.key] ? 'error' : ''}
                autoComplete="off"
              />
              {errors[f.key] ? <span className="err-msg">{errors[f.key]}</span> : <span className="hint">{f.hint}</span>}
            </div>
          ))}
        </div>

        <div className="dry-run-row">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={form.dryRun}
              onChange={e => setForm(p => ({ ...p, dryRun: e.target.checked }))}
            />
            <span className="toggle-track"><span className="toggle-thumb" /></span>
            <span>Dry run <span className="muted">(skip actual email sending)</span></span>
          </label>
        </div>

        <button type="submit" className="run-btn">
          <span className="run-icon">▶</span>
          Run Pipeline
        </button>
      </form>
    </div>
  )
}
