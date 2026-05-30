import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'

export function PaperFormPage() {
  const navigate = useNavigate()
  const [tagsInput, setTagsInput] = useState('')
  const [file, setFile] = useState(null)

  const PAPER_STATUSES = ['ToRead', 'Reading', 'Used in Literature Review', 'Cited']

  const [form, setForm] = useState({
    title: '',
    abstract: '',
    authors: '',
    priority: 0,
    status: 'ToRead',
  })

  const suggestTags = async () => {
    if (!form.abstract?.trim()) return
    const { data } = await api.post('/papers/suggest-tags', { text: form.abstract })
    setTagsInput((data.tags || []).join(', '))
  }

  const save = async (e) => {
    e.preventDefault()
    const tags = tagsInput.split(',').map((x) => x.trim()).filter(Boolean)

    // CreatePaperDto has no Status field, so we create first, then update status if needed.
    const { data } = await api.post('/papers', {
      title: form.title,
      abstract: form.abstract,
      authors: form.authors,
      year: null,
      venue: null,
      doi: null,
      paperUrl: null,
      pdfUrl: null,
      priority: Number(form.priority),
      categoryId: null,
      tags,
    })

    if (file && data?.id) {
      const fd = new FormData()
      fd.append('file', file)
      await api.post(`/papers/${data.id}/upload`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    }

    // Update status (and keep everything else consistent) via UpdatePaperDto.
    if (data?.id) {
      await api.put(`/papers/${data.id}`, {
        title: form.title,
        abstract: form.abstract,
        authors: form.authors,
        year: null,
        venue: null,
        doi: null,
        paperUrl: null,
        pdfUrl: null,
        status: form.status,
        priority: Number(form.priority),
        categoryId: null,
        tags,
      })
    }

    navigate('/app/papers')
  }

  return (
    <section>
      <h2>Add / Edit Paper</h2>
      <form className="card" onSubmit={save}>
        <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" required />
        <textarea value={form.abstract} onChange={(e) => setForm({ ...form, abstract: e.target.value })} placeholder="Abstract" />
        <div className="inline-actions"><button type="button" className="btn btn-light" onClick={suggestTags}>Suggest Tags</button></div>
        <input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="Tags (comma separated)" />
        <input value={form.authors} onChange={(e) => setForm({ ...form, authors: e.target.value })} placeholder="Authors" />
        <label>Status</label>
        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
          {PAPER_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <label>Priority</label>
        <select value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })}>
          <option value={0}>Low</option>
          <option value={1}>Medium</option>
          <option value={2}>High</option>
          <option value={3}>Critical</option>
        </select>

        <label>Upload PDF (optional)</label>
        <input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        <button className="btn" type="submit">Save Paper</button>
      </form>
    </section>
  )
}
