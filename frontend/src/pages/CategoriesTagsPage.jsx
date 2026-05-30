import { useEffect, useState } from 'react'
import api from '../api/client'

export function CategoriesTagsPage() {
  const [categories, setCategories] = useState([])
  const [tags, setTags] = useState([])
  const [name, setName] = useState('')

  const load = async () => {
    const [c, t] = await Promise.all([api.get('/categories'), api.get('/tags')])
    setCategories(c.data)
    setTags(t.data)
  }

  useEffect(() => { load() }, [])

  const add = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    await api.post('/categories', { name })
    setName('')
    load()
  }

  const remove = async (id) => {
    await api.delete(`/categories/${id}`)
    load()
  }

  return (
    <section>
      <h2>Categories / Tags</h2>
      <div className="grid-2">
        <form className="card" onSubmit={add}>
          <h3>Categories</h3>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New category" />
          <button className="btn" type="submit">Add Category</button>
          <ul className="simple-list">
            {categories.map((c) => (
              <li key={c.id}><span>{c.name}</span><button className="link" type="button" onClick={() => remove(c.id)}>Delete</button></li>
            ))}
          </ul>
        </form>

        <div className="card">
          <h3>Auto-generated Tags</h3>
          <div className="chip-wrap">
            {tags.map((t) => <span key={t.id} className="tag-chip">{t.name}</span>)}
          </div>
        </div>
      </div>
    </section>
  )
}
