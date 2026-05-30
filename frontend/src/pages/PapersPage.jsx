import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'

export function PapersPage() {
  const [papers, setPapers] = useState([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [q, setQ] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      api.get(`/papers?page=${page}&pageSize=10&q=${encodeURIComponent(q)}`).then(({ data }) => {
        setPapers(data.items || [])
        setTotal(data.totalCount || 0)
      }).catch(() => {})
    }, 250)
    return () => clearTimeout(timer)
  }, [page, q])

  const totalPages = Math.max(1, Math.ceil(total / 10))
  const filtered = useMemo(() => papers, [papers])

  return (
    <section>
      <div className="section-head">
        <h2>All Papers</h2>
        <Link to="/app/papers/new" className="btn">Add</Link>
      </div>
      <input placeholder="Filter by title, author, tag" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="card table-wrap">
        <table className="paper-table">
          <thead><tr><th>Title</th><th>Authors</th><th>Status</th><th>Priority</th><th>Tags</th></tr></thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id}>
                <td><Link to={`/app/papers/${p.id}`}>{p.title}</Link></td>
                <td>{p.authors || '-'}</td>
                <td>{p.status || '-'}</td>
                <td>{p.priority ?? 0}</td>
                <td>{(p.tags || []).join(', ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="inline-actions" style={{ marginTop: '10px' }}>
        <button className="btn btn-light" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
        <span>Page {page} / {totalPages}</span>
        <button className="btn btn-light" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
      </div>
    </section>
  )
}
