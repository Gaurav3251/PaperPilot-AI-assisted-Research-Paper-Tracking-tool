import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api/client'

export function PaperDetailsPage() {
  const { id } = useParams()
  const [paper, setPaper] = useState(null)

  useEffect(() => {
    if (!id) return
    api.get(`/papers/${id}`).then(({ data }) => setPaper(data)).catch(() => {})
  }, [id])

  if (!paper) return <section><h2>Paper Details</h2><p>Loading...</p></section>

  return (
    <section>
      <h2>Paper Details</h2>
      <article className="card">
        <h3>{paper.title}</h3>
        <p>{paper.abstract || 'No abstract available.'}</p>
        <p><strong>Authors:</strong> {paper.authors || '-'}</p>
        <p><strong>Tags:</strong> {(paper.tags || []).join(', ') || '-'}</p>
      </article>
    </section>
  )
}
