import './ContactsTable.css'

const LABELS = {
  full_name: 'Name',
  email: 'Email',
  job_title: 'Title',
  company_name: 'Company',
  linkedin_url: 'LinkedIn',
}

export default function ContactsTable({ rows, columns }) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>{columns.map(c => <th key={c}>{LABELS[c] || c}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {columns.map(c => (
                <td key={c}>
                  {c === 'linkedin_url' && row[c] ? (
                    <a href={row[c]} target="_blank" rel="noreferrer" className="table-link">View ↗</a>
                  ) : (
                    row[c] || <span className="empty">—</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
