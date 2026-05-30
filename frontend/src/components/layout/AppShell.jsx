import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import logo from '../../assets/paperpilot-logo.png'
import bg from '../../assets/landing-bg.png'

const navItems = [
  ['Dashboard', '/app'],
  ['All Papers', '/app/papers'],
  ['Add Paper', '/app/papers/new'],
  ['Categories/Tags', '/app/categories-tags'],
  ['Collections', '/app/collections'],
  ['Notes Workspace', '/app/notes'],
  ['Profile/Settings', '/app/settings'],
]

export function AppShell() {
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)
  const email = useAuthStore((s) => s.email)
  const [dark, setDark] = useState(localStorage.getItem('theme') === 'dark')

  useEffect(() => {
    document.body.classList.toggle('dark-theme', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  return (
    <div className="shell" style={{ '--bgimg': `url(${bg})` }}>
      <aside className="sidebar">
        <button className="brand-btn" onClick={() => navigate('/')}>
          <img src={logo} alt="PaperPilot" />
          <div>
            <strong>PaperPilot</strong>
            <small>Research Tracker</small>
          </div>
        </button>

        <nav className="sidebar-nav">
          {navItems.map(([label, href]) => (
            <NavLink key={href} to={href} end={href === '/app'} className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="content-wrap">
        <header className="topbar">
          <input className="top-search" placeholder="Search title, keyword, author..." />
          <div className="top-actions">
            <button className="icon-btn" title="Toggle theme" onClick={() => setDark((v) => !v)}>
              {dark ? 'Light mode' : 'Dark mode'}
            </button>
            <span className="user-chip">{email || 'Researcher'}</span>
            <button className="icon-btn" onClick={() => { logout(); navigate('/login') }}>Logout</button>
          </div>
        </header>

        <main className="main-panel">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
