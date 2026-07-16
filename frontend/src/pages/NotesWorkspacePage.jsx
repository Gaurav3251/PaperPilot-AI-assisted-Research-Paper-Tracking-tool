import { useEffect, useState } from 'react'
import api from '../api/client'
import { downloadNotesAsText, downloadNotesAsWord } from '../utils/noteExport'

export function NotesWorkspacePage() {
  const [papers, setPapers] = useState([])
  const [paperId, setPaperId] = useState('')
  const [notes, setNotes] = useState([])
  const [content, setContent] = useState('')
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    api.get('/papers?page=1&pageSize=100').then(({ data }) => setPapers(data.items || []))
  }, [])

  const selectedPaper = papers.find((p) => p.id === paperId)

  const loadNotes = async (id) => {
    setPaperId(id)
    if (!id) {
      setNotes([])
      return
    }
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

  const exportAsText = () => {
    downloadNotesAsText(selectedPaper?.title || 'Notes', notes)
  }

  const exportAsWord = async () => {
    try {
      setExporting(true)
      await downloadNotesAsWord(selectedPaper?.title || 'Notes', notes)
    } finally {
      setExporting(false)
    }
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

          {paperId && (
            <div className="inline-actions" style={{ margin: '10px 0' }}>
              <button
                type="button"
                className="btn btn-light"
                onClick={exportAsText}
                disabled={!notes.length}
                title={!notes.length ? 'No notes to export yet' : 'Download all notes as a .txt file'}
              >
                Download as Text
              </button>
              <button
                type="button"
                className="btn btn-light"
                onClick={exportAsWord}
                disabled={!notes.length || exporting}
                title={!notes.length ? 'No notes to export yet' : 'Download all notes as a Word document'}
              >
                {exporting ? 'Preparing…' : 'Download as Word'}
              </button>
            </div>
          )}

          <ul className="simple-list">
            {notes.map((n) => <li key={n.id}>{n.content}</li>)}
            {paperId && !notes.length && <li>No notes yet for this paper.</li>}
          </ul>
        </div>

        <form className="card" onSubmit={addNote}>
          <h3>Add Note</h3>
          <textarea rows={8} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write your observation..." disabled={!paperId} />
          <button className="btn" type="submit" disabled={!paperId}>Save Note</button>
          {!paperId && <p className="muted" style={{ marginTop: '8px' }}>Select a paper first.</p>}
        </form>
      </div>
    </section>
  )
}
