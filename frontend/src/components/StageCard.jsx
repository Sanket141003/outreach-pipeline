import './StageCard.css'

const STATUS_ICONS = {
  pending: '○',
  running: '◌',
  done: '✓',
  error: '✗',
  skipped: '—',
}

export default function StageCard({ stage, status, active }) {
  return (
    <div className={`stage-card stage-${status} ${active ? 'stage-active' : ''}`}>
      <div className="stage-header">
        <span className="stage-num">{stage.num}</span>
        <span className={`stage-icon icon-${status}`}>{STATUS_ICONS[status]}</span>
      </div>
      <div className="stage-name">{stage.name}</div>
      <div className="stage-desc">{stage.desc}</div>
      {status === 'running' && <div className="stage-bar"><div className="stage-bar-fill" /></div>}
    </div>
  )
}
