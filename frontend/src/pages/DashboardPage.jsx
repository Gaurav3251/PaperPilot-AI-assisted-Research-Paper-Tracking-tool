import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'

export function DashboardPage() {
  const navigate = useNavigate()
  const [papers, setPapers] = useState([])

  useEffect(() => {
    api.get('/papers?page=1&pageSize=100').then(({ data }) => setPapers(data.items || [])).catch(() => {})
  }, [])

  const counts = {
    total: papers.length,
    tagged: papers.filter((p) => (p.tags || []).length > 0).length,
    high: papers.filter((p) => (p.priority || 0) >= 3).length,
  }

  return (
    <section>
      <h2>Dashboard</h2>
      <div className="kpi-row">
        <article className="card kpi"><span>Total Papers</span><strong>{counts.total}</strong></article>
        <article className="card kpi"><span>Tagged</span><strong>{counts.tagged}</strong></article>
        <article className="card kpi"><span>High Priority</span><strong>{counts.high}</strong></article>
      </div>
      <div className="card">
        <h3>Quick Actions</h3>
        <div className="inline-actions">
          <button className="btn" onClick={() => navigate('/app/papers/new')}>Add Paper</button>
          <button className="btn btn-light" onClick={() => navigate('/app/papers')}>View Papers</button>
        </div>
      </div>
    </section>
  )
}
