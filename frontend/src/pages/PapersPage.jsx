import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import api from '../api/client'

export function PapersPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const refresh = searchParams.get('refresh')
  const [papers, setPapers] = useState([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [q, setQ] = useState('')

  const PRIORITY_LABELS = {
    0: 'Low',
    1: 'Medium',
    2: 'High',
    3: 'Critical',
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      api.get(`/papers?page=${page}&pageSize=10&q=${encodeURIComponent(q)}`).then(({ data }) => {
        setPapers(data.items || [])
        setTotal(data.totalCount || 0)
      }).catch(() => {})
    }, 250)
    return () => clearTimeout(timer)
  }, [page, q, location.key, refresh])

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
          <thead><tr><th>Title</th><th>Authors</th><th>Status</th><th>Priority</th><th>Tags</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id}>
                <td><Link to={`/app/papers/${p.id}`}>{p.title}</Link></td>
                <td>{p.authors || '-'}</td>
                <td>{p.status || '-'}</td>
                <td>{PRIORITY_LABELS[p.priority] ?? 'Low'}</td>
                <td>{(p.tags || []).join(', ')}</td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button
                    className="btn btn-light"
                    type="button"
                    onClick={() => navigate(`/app/papers/new?id=${p.id}`)}
                  >
                    Edit
                  </button>{' '}
                  <button
                    className="btn btn-light"
                    type="button"
                    onClick={async () => {
                      if (!confirm('Delete this paper?')) return
                      await api.delete(`/papers/${p.id}`)
                      setPage(1)
                      // re-fetch is driven by page/q, so resetting page refreshes list
                      setTimeout(() => window.location.reload(), 0)
                    }}
                  >
                    Delete
                  </button>
                </td>
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