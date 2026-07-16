import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useAuthStore } from '../store/authStore'
import logo from '../assets/paperpilot-logo.png'
import bg from '../assets/landing-bg.png'

export function LoginPage() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('User')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const [isSendingReset, setIsSendingReset] = useState(false)

  const submitAuth = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    try {
      const endpoint = mode === 'register' ? '/auth/register' : '/auth/login'
      const payload = mode === 'register' ? { email, password, fullName: fullName || email, role } : { email, password }
      const { data } = await api.post(endpoint, payload)
      login(data)
      navigate('/app')
    } catch (err) {
      setError(err?.response?.data?.error || 'Authentication failed')
    }
  }

  const authPrefix = (() => {
    // Some setups set VITE_API_URL to ".../api", others to "...".
    // Backend routes are under [Route("api/auth")].
    const base = import.meta.env.VITE_API_URL || ''
    const baseIncludesApi = base.toLowerCase().includes('/api')
    // If base already includes /api, use /auth/*
    // Otherwise use /api/auth/*
    return baseIncludesApi ? '/auth' : '/api/auth'
  })()

  const requestReset = async () => {
    setError('')
    setMessage('')
    if (!email?.trim()) {
      setError('Email is required')
      return
    }

    try {
      setIsSendingReset(true)
      await api.post(`${authPrefix}/forgot-password`, { email })
      setMessage('If an account exists for that email, a reset link has been sent.')
      setMode('login')
    } catch (err) {
      setError(err?.response?.data?.error || 'Could not request reset')
    } finally {
      setIsSendingReset(false)
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
      <form className="card" onSubmit={submitAuth}>
        <h2>{mode === 'register' ? 'Create account' : 'Welcome back'}</h2>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
        {mode === 'register' && <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" />}
        {mode === 'register' && (
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="User">User</option>
            <option value="Admin">Admin</option>
          </select>
        )}
        {(mode === 'login' || mode === 'register') && <input value={password} type="password" onChange={(e) => setPassword(e.target.value)} placeholder="Password" required />}
        {(mode === 'login' || mode === 'register') && <button className="btn" type="submit">{mode === 'register' ? 'Register' : 'Login'}</button>}

        <div className="inline-actions">
          <button type="button" className="link" onClick={() => setMode(mode === 'register' ? 'login' : 'register')}>{mode === 'register' ? 'Already have an account?' : 'Need an account?'}</button>
          <button type="button" className="link" onClick={() => setMode('forgot')}>Forgot password?</button>
        </div>

        {mode === 'forgot' && (
          <div className="reset-box">
            <button
              type="button"
              className="btn btn-light"
              onClick={requestReset}
              disabled={isSendingReset}
            >
              {isSendingReset ? 'Sending…' : 'Send reset link'}
            </button>
            <p style={{ marginTop: '10px', color: '#666', fontSize: '0.95em' }}>
              Check your email for the reset link.
            </p>
          </div>
        )}

        {message && <p className="msg ok">{message}</p>}
        {error && <p className="msg err">{error}</p>}
      </form>
      </main>
    </div>
  )
}
