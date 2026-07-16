import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../api/client'

export function PaperFormPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('id')

  const [tagsInput, setTagsInput] = useState('')
  const [file, setFile] = useState(null)
  const [categories, setCategories] = useState([])
  const [existingPdfUrl, setExistingPdfUrl] = useState(null)
  const [error, setError] = useState('')

  // Backend enum values: ToRead, Reading, Summarized, UsedInProject, Cited
  // UI wants: To Read, Reading, Used in Literature Review, Cited
  // We map "Used in Literature Review" -> UsedInProject (backend value).
  const PAPER_STATUSES = [
    { value: 'ToRead', label: 'To Read' },
    { value: 'Reading', label: 'Reading' },
    { value: 'UsedInProject', label: 'Used in Literature Review' },
    { value: 'Cited', label: 'Cited' },
  ]

  const [form, setForm] = useState({
    title: '',
    abstract: '',
    authors: '',
    venue: '',
    year: '',
    doi: '',
    paperUrl: '',
    priority: 0,
    status: 'ToRead',
    categoryId: '',
  })

  useEffect(() => {
    api.get('/categories').then(({ data }) => setCategories(data || [])).catch(() => {})
  }, [])

  const suggestTags = async () => {
    if (!form.abstract?.trim()) return
    const { data } = await api.post('/papers/suggest-tags', { text: form.abstract })
    setTagsInput((data.tags || []).join(', '))
  }

  useEffect(() => {
    if (!editId) return
    api.get(`/papers/${editId}`).then(({ data }) => {
      setForm((prev) => ({
        ...prev,
        title: data.title ?? '',
        abstract: data.abstract ?? '',
        authors: data.authors ?? '',
        venue: data.venue ?? '',
        year: data.year ?? '',
        doi: data.doi ?? '',
        paperUrl: data.paperUrl ?? '',
        priority: Number(data.priority ?? 0),
        status: data.status ?? 'ToRead',
        categoryId: data.categoryId ?? '',
      }))
      setTagsInput((data.tags || []).join(', '))
      setExistingPdfUrl(data.pdfUrl || null)
    }).catch(() => {})
  }, [editId])

  const tags = useMemo(
    () => tagsInput.split(',').map((x) => x.trim()).filter(Boolean),
    [tagsInput]
  )

  const buildPayload = (extra = {}) => ({
    title: form.title,
    abstract: form.abstract || null,
    authors: form.authors || null,
    year: form.year ? Number(form.year) : null,
    venue: form.venue || null,
    doi: form.doi || null,
    paperUrl: form.paperUrl || null,
    pdfUrl: null, // never wipe an already-uploaded PDF from this form; the upload endpoint owns pdfUrl
    priority: Number(form.priority),
    categoryId: form.categoryId || null,
    tags,
    ...extra,
  })

  const save = async (e) => {
    e.preventDefault()
    setError('')

    try {
      if (editId) {
        // Update existing paper
        await api.put(`/papers/${editId}`, buildPayload({ status: form.status }))

        if (file) {
          const fd = new FormData()
          fd.append('file', file)
          await api.post(`/papers/${editId}/upload`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        }

        navigate(`/app/papers?refresh=${Date.now()}`)
        return
      }

      // Create new paper (status is fixed to ToRead server-side on create)
      const { data } = await api.post('/papers', buildPayload())

      if (file && data?.id) {
        const fd = new FormData()
        fd.append('file', file)
        await api.post(`/papers/${data.id}/upload`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      }

      // Apply the chosen status (create always starts as ToRead).
      if (data?.id && form.status !== 'ToRead') {
        await api.put(`/papers/${data.id}`, buildPayload({ status: form.status }))
      }

      navigate(`/app/papers?refresh=${Date.now()}`)
    } catch (err) {
      setError(err?.response?.data?.error || 'Could not save paper')
    }
  }

  return (
    <section>
      <h2>{editId ? 'Edit Paper' : 'Add Paper'}</h2>
      <form className="card" onSubmit={save}>
        <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" required />
        <textarea value={form.abstract} onChange={(e) => setForm({ ...form, abstract: e.target.value })} placeholder="Abstract" />
        <div className="inline-actions"><button type="button" className="btn btn-light" onClick={suggestTags}>Suggest Tags</button></div>
        <input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="Tags (comma separated)" />
        <input value={form.authors} onChange={(e) => setForm({ ...form, authors: e.target.value })} placeholder="Authors" />

        <div className="grid-2">
          <input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} placeholder="Venue / Journal / Conference" />
          <input
            type="number"
            value={form.year}
            onChange={(e) => setForm({ ...form, year: e.target.value })}
            placeholder="Year"
          />
        </div>

        <div className="grid-2">
          <input value={form.doi} onChange={(e) => setForm({ ...form, doi: e.target.value })} placeholder="DOI (e.g. 10.1000/xyz123)" />
          <input value={form.paperUrl} onChange={(e) => setForm({ ...form, paperUrl: e.target.value })} placeholder="Paper URL (link to source)" />
        </div>

        <label>Category</label>
        <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
          <option value="">No category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <label>Status</label>
        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
          {PAPER_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        <label>Priority</label>
        <select value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })}>
          <option value={0}>Low</option>
          <option value={1}>Medium</option>
          <option value={2}>High</option>
          <option value={3}>Critical</option>
        </select>

        <label>Upload PDF {existingPdfUrl ? '(replace existing file)' : '(optional)'}</label>
        <input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />

        {error && <p className="msg err">{error}</p>}
        <button className="btn" type="submit">Save Paper</button>
      </form>
    </section>
  )
}
