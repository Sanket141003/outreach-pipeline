import { useEffect, useRef, useState } from 'react'
import StageCard from './StageCard'
import ContactsTable from './ContactsTable'
import ResultsPanel from './ResultsPanel'
import './PipelineRunner.css'

const API_BASE = import.meta.env.VITE_API_URL || ''

const STAGES = [
  { num: 1, name: 'Ocean.io', desc: 'Finding lookalike companies' },
  { num: 2, name: 'Prospeo', desc: 'Finding decision-makers' },
  { num: 3, name: 'Email Enrichment', desc: 'Resolving work emails' },
  { num: 4, name: 'Brevo', desc: 'Sending outreach emails' },
]

export default function PipelineRunner({ config, onReset }) {
  const [stageStatus, setStageStatus] = useState({ 1: 'pending', 2: 'pending', 3: 'pending', 4: 'pending' })
  const [activeStage, setActiveStage] = useState(null)
  const [companies, setCompanies] = useState([])
  const [prospects, setProspects] = useState([])
  const [contacts, setContacts] = useState([])
  const [results, setResults] = useState([])
  const [log, setLog] = useState([])
  const [status, setStatus] = useState('running')
  const [errorMsg, setErrorMsg] = useState('')
  const logEndRef = useRef(null)
  const abortRef = useRef(null)

  const addLog = (msg, type = 'info') =>
    setLog(l => [...l, { msg, type, ts: new Date().toLocaleTimeString() }])

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [log])

  useEffect(() => {
    const controller = new AbortController()
    abortRef.current = controller

    async function run() {
      try {
        const res = await fetch(`${API_BASE}/api/run`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            domain: config.domain,
            dryRun: config.dryRun,
          }),
          signal: controller.signal,
        })

        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || `Server error ${res.status}`)
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() // keep incomplete line

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const raw = line.slice(6).trim()
            if (!raw) continue

            let data
            try { data = JSON.parse(raw) } catch { continue }
            handleEvent(data)
          }
        }
      } catch (err) {
        if (err.name === 'AbortError') return
        setStatus('error')
        setErrorMsg(err.message || 'Connection failed')
        addLog(err.message || 'Connection failed', 'error')
      }
    }

    run()
    return () => controller.abort()
  }, [])

  function handleEvent(data) {
    switch (data.type) {
      case 'stage':
        setActiveStage(data.stage)
        setStageStatus(s => ({ ...s, [data.stage]: 'running' }))
        addLog(data.message, 'stage')
        break
      case 'stage1_done':
        setStageStatus(s => ({ ...s, 1: 'done' }))
        setCompanies(data.companies)
        addLog(`Found ${data.companies.length} lookalike companies`, 'success')
        break
      case 'stage2_done':
        setStageStatus(s => ({ ...s, 2: 'done' }))
        setProspects(data.prospects)
        addLog(`Found ${data.prospects.length} decision-makers`, 'success')
        break
      case 'stage3_done':
        setStageStatus(s => ({ ...s, 3: 'done' }))
        setContacts(data.contacts)
        addLog(`Resolved ${data.contacts.length} verified emails`, 'success')
        break
      case 'stage4_done':
        setStageStatus(s => ({ ...s, 4: 'done' }))
        setResults(data.results)
        addLog(`Sent: ${data.results.filter(r => r.success).length} ✓, Failed: ${data.results.filter(r => !r.success).length} ✗`, 'success')
        break
      case 'dry_run':
        setStageStatus(s => ({ ...s, 4: 'skipped' }))
        setContacts(data.contacts)
        addLog('Dry run — emails not sent', 'warn')
        break
      case 'done':
        setStatus('done')
        addLog('Pipeline complete!', 'success')
        break
      case 'error':
        setStatus('error')
        setErrorMsg(data.message)
        addLog(`Error: ${data.message}`, 'error')
        setStageStatus(s => {
          const next = { ...s }
          Object.keys(next).forEach(k => { if (next[k] === 'running') next[k] = 'error' })
          return next
        })
        break
    }
  }

  return (
    <div className="runner-wrap">
      <div className="runner-header">
        <div>
          <h2 className="runner-title">
            {status === 'running' ? 'Pipeline running...' : status === 'done' ? 'Pipeline complete' : 'Pipeline stopped'}
          </h2>
          <p className="runner-domain">Seed: <strong>{config.domain}</strong></p>
        </div>
        {(status === 'done' || status === 'error') && (
          <button className="reset-btn" onClick={onReset}>← Start over</button>
        )}
      </div>

      <div className="stages-row">
        {STAGES.map(s => (
          <StageCard key={s.num} stage={s} status={stageStatus[s.num]} active={activeStage === s.num} />
        ))}
      </div>

      <div className="log-box">
        <div className="log-title">Live log</div>
        <div className="log-entries">
          {log.map((l, i) => (
            <div key={i} className={`log-entry log-${l.type}`}>
              <span className="log-ts">{l.ts}</span>
              <span>{l.msg}</span>
            </div>
          ))}
          <div ref={logEndRef} />
        </div>
      </div>

      {companies.length > 0 && (
        <Section title={`Lookalike Companies (${companies.length})`}>
          <div className="tag-list">
            {companies.map(c => (
              <a key={c.domain} href={`https://${c.domain}`} target="_blank" rel="noreferrer" className="tag">
                {c.name}<span className="tag-domain">{c.domain}</span>
              </a>
            ))}
          </div>
        </Section>
      )}

      {prospects.length > 0 && (
        <Section title={`Decision-Makers (${prospects.length})`}>
          <ContactsTable rows={prospects} columns={['full_name', 'job_title', 'company_name', 'linkedin_url']} />
        </Section>
      )}

      {contacts.length > 0 && (
        <Section title={`Verified Emails (${contacts.length})`}>
          <ContactsTable rows={contacts} columns={['full_name', 'email', 'job_title', 'company_name']} />
        </Section>
      )}

      {results.length > 0 && (
        <Section title={`Email Results (${results.length})`}>
          <ResultsPanel results={results} />
        </Section>
      )}

      {status === 'done' && config.dryRun && contacts.length > 0 && (
        <div className="dry-run-banner">
          ✓ Dry run complete — {contacts.length} email(s) ready to send. Re-run without dry run to actually send.
        </div>
      )}

      {status === 'error' && (
        <div className="error-banner">✗ {errorMsg}</div>
      )}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="result-section">
      <div className="section-title">{title}</div>
      {children}
    </div>
  )
}
