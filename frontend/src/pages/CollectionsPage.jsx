import { useEffect, useState } from 'react'
import api from '../api/client'

export function CollectionsPage() {
  const [collections, setCollections] = useState([])
  const [papers, setPapers] = useState([])
  const [name, setName] = useState('')
  const [paperId, setPaperId] = useState('')
  const [collectionId, setCollectionId] = useState('')

  const load = async () => {
    const [c, p] = await Promise.all([api.get('/collections'), api.get('/papers?page=1&pageSize=100')])
    setCollections(c.data)
    setPapers(p.data.items || [])
  }
  useEffect(() => { load() }, [])

  const add = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    await api.post('/collections', { name })
    setName('')
    load()
  }

  const attach = async () => {
    if (!collectionId || !paperId) return
    await api.post(`/collections/${collectionId}/papers/${paperId}`)
    alert('Paper linked to collection')
  }

  const remove = async (id) => {
    await api.delete(`/collections/${id}`)
    load()
  }

  return (
    <section>
      <h2>Collections</h2>
      <div className="grid-2">
        <form className="card" onSubmit={add}>
          <h3>Create Collection</h3>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Survey Papers" />
          <button className="btn" type="submit">Create</button>
          <ul className="simple-list">
            {collections.map((c) => (
              <li key={c.id}><span>{c.name}</span><button type="button" className="link" onClick={() => remove(c.id)}>Delete</button></li>
            ))}
          </ul>
        </form>

        <div className="card">
          <h3>Attach Paper to Collection</h3>
          <select value={collectionId} onChange={(e) => setCollectionId(e.target.value)}>
            <option value="">Select collection</option>
            {collections.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={paperId} onChange={(e) => setPaperId(e.target.value)}>
            <option value="">Select paper</option>
            {papers.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
          <button className="btn" type="button" onClick={attach}>Attach</button>
        </div>
      </div>
    </section>
  )
}
