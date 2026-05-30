import { useEffect, useState } from 'react'
import api from '../api/client'

export function SettingsPage() {
  const [me, setMe] = useState(null)

  useEffect(() => {
    api.get('/auth/me').then(({ data }) => setMe(data)).catch(() => {})
  }, [])

  return (
    <section>
      <h2>Profile / Settings</h2>
      <div className="card">
        <p><strong>Email:</strong> {me?.email || '-'}</p>
        <p><strong>Role:</strong> {me?.role || '-'}</p>
        <p className="muted">Theme toggle is available in top bar (Light/Dark mode).</p>
      </div>
    </section>
  )
}
