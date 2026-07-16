import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api, { getFileUrl } from '../api/client'

export function PaperDetailsPage() {
  const { id } = useParams()
  const [paper, setPaper] = useState(null)

  useEffect(() => {
    if (!id) return
    api.get(`/papers/${id}`).then(({ data }) => setPaper(data)).catch(() => {})
  }, [id])

  if (!paper) return <section><h2>Paper Details</h2><p>Loading...</p></section>

  const pdfSrc = getFileUrl(paper.pdfUrl || paper.PdfUrl)
  const thumbSrc = getFileUrl(paper.thumbUrl || paper.ThumbUrl)

  return (
    <section>
      <div className="section-head">
        <h2>Paper Details</h2>
        <Link to={`/app/papers/new?id=${paper.id}`} className="btn btn-light">Edit</Link>
      </div>
      <article className="card">
        <h3>{paper.title}</h3>
        <p>{paper.abstract || 'No abstract available.'}</p>
        <p><strong>Authors:</strong> {paper.authors || '-'}</p>
        <p><strong>Venue:</strong> {paper.venue || '-'}</p>
        <p><strong>Year:</strong> {paper.year || '-'}</p>
        <p><strong>DOI:</strong> {paper.doi || '-'}</p>
        <p><strong>Paper URL:</strong> {paper.paperUrl ? <a href={paper.paperUrl} target="_blank" rel="noreferrer">{paper.paperUrl}</a> : '-'}</p>
        <p><strong>Status:</strong> {paper.status || '-'}</p>
        <p><strong>Tags:</strong> {(paper.tags || []).join(', ') || '-'}</p>

        {thumbSrc ? (
          <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h4>Preview</h4>
            <img
              src={thumbSrc}
              alt="Paper thumbnail"
              style={{ width: '100%', maxHeight: '220px', objectFit: 'contain', border: '1px solid #ddd', borderRadius: '6px' }}
            />
          </div>
        ) : null}

        {pdfSrc ? (
          <div style={{ marginTop: '14px' }}>
            <h4>PDF</h4>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '8px' }}>
              <a href={pdfSrc} target="_blank" rel="noreferrer" className="btn">
                View PDF
              </a>
              <span style={{ fontSize: '0.9em', color: '#666' }}></span>
            </div>
            <iframe
              src={pdfSrc}
              title="Paper PDF"
              style={{ width: '100%', height: '70vh', border: '1px solid #ddd', borderRadius: '6px' }}
            />
          </div>
        ) : null}
      </article>
    </section>
  )
}
