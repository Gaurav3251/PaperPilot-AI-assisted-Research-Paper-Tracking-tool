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
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

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
    setError(''); setMessage('')
    try {
      const { data } = await api.post(`${authPrefix}/forgot-password`, { email })
      if (!data?.token) {
        setMessage('If account exists, reset process initiated.')
      } else {
        setResetToken(data.token)
        setMessage('Reset token generated. Paste token and set new password.')
      }
    } catch (err) {
      setError(err?.response?.data?.error || 'Could not request reset')
    }
  }

  const doReset = async () => {
    setError(''); setMessage('')
    try {
      await api.post(`${authPrefix}/reset-password`, { email, token: resetToken, newPassword })
      setMessage('Password updated. You can login now.')
      setMode('login')
    } catch (err) {
      setError(err?.response?.data?.error || 'Reset failed')
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
            <button type="button" className="btn btn-light" onClick={requestReset}>Generate Reset Token</button>
            <input value={resetToken} onChange={(e) => setResetToken(e.target.value)} placeholder="Reset token" />
            <input value={newPassword} type="password" onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" />
            <button type="button" className="btn" onClick={doReset}>Reset Password</button>
          </div>
        )}

        {message && <p className="msg ok">{message}</p>}
        {error && <p className="msg err">{error}</p>}
      </form>
      </main>
    </div>
  )
}
