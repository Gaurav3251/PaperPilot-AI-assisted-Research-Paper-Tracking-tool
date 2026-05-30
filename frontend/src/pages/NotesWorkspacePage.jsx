import { useEffect, useState } from 'react'
import api from '../api/client'

export function NotesWorkspacePage() {
  const [papers, setPapers] = useState([])
  const [paperId, setPaperId] = useState('')
  const [notes, setNotes] = useState([])
  const [content, setContent] = useState('')

  useEffect(() => {
    api.get('/papers?page=1&pageSize=100').then(({ data }) => setPapers(data.items || []))
  }, [])

  const loadNotes = async (id) => {
    setPaperId(id)
    const { data } = await api.get(`/notes/paper/${id}`)
    setNotes(data)
  }

  const addNote = async (e) => {
    e.preventDefault()
    if (!paperId || !content.trim()) return
    await api.post('/notes', { paperId, content })
    setContent('')
    loadNotes(paperId)
  }

  return (
    <section>
      <h2>Notes Workspace</h2>
      <div className="grid-2">
        <div className="card">
          <h3>Select Paper</h3>
          <select value={paperId} onChange={(e) => loadNotes(e.target.value)}>
            <option value="">Choose paper</option>
            {papers.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
          <ul className="simple-list">
            {notes.map((n) => <li key={n.id}>{n.content}</li>)}
          </ul>
        </div>

        <form className="card" onSubmit={addNote}>
          <h3>Add Note</h3>
          <textarea rows={8} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write your observation..." />
          <button className="btn" type="submit">Save Note</button>
        </form>
      </div>
    </section>
  )
}
