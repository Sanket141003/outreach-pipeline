import './ResultsPanel.css'

export default function ResultsPanel({ results }) {
  const sent = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length

  return (
    <div>
      <div className="results-summary">
        <span className="summary-item success">✓ {sent} sent</span>
        {failed > 0 && <span className="summary-item fail">✗ {failed} failed</span>}
      </div>
      <div className="results-list">
        {results.map((r, i) => (
          <div key={i} className={`result-row ${r.success ? 'row-success' : 'row-fail'}`}>
            <span className="result-icon">{r.success ? '✓' : '✗'}</span>
            <div className="result-info">
              <span className="result-name">{r.name}</span>
              <span className="result-email">{r.email}</span>
            </div>
            {!r.success && <span className="result-error">{r.error}</span>}
          </div>
        ))}
      </div>
    </div>
  )
}
