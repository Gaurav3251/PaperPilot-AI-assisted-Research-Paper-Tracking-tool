import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import api from '../api/client'
import logo from '../assets/paperpilot-logo.png'
import bg from '../assets/landing-bg.png'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email') || ''
  const token = searchParams.get('token') || ''

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const linkIsValid = Boolean(email && token)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (!linkIsValid) {
      setError('This reset link is invalid or incomplete. Please request a new one.')
      return
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    try {
      setSubmitting(true)
      await api.post('/auth/reset-password', { email, token, newPassword })
      setMessage('Your password has been updated. You can now log in.')
      setTimeout(() => navigate('/login'), 1500)
    } catch (err) {
      setError(err?.response?.data?.error || 'Could not reset password. The link may have expired — please request a new one.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-bg" style={{ '--bgimg': `url(${bg})` }}>
      <main className="auth-wrap">
        <div style={{ marginBottom: '12px' }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <img src={logo} alt="PaperPilot" style={{ width: '44px', height: '44px', borderRadius: '10px' }} />
            <strong>PaperPilot</strong>
          </Link>
        </div>
        <form className="card" onSubmit={submit}>
          <h2>Reset your password</h2>

          {!linkIsValid && (
            <p className="msg err">
              This link is missing required information. Please use the link from the reset email, or{' '}
              <Link to="/login">request a new one</Link>.
            </p>
          )}

          {linkIsValid && <p className="muted">Resetting password for <strong>{email}</strong></p>}

          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password"
            disabled={!linkIsValid}
            required
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            disabled={!linkIsValid}
            required
          />

          <button className="btn" type="submit" disabled={!linkIsValid || submitting}>
            {submitting ? 'Updating…' : 'Update password'}
          </button>

          <div className="inline-actions">
            <Link to="/login" className="link">Back to login</Link>
          </div>

          {message && <p className="msg ok">{message}</p>}
          {error && <p className="msg err">{error}</p>}
        </form>
      </main>
    </div>
  )
}
