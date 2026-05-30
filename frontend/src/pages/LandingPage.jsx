import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import logo from '../assets/paperpilot-logo.png'
import bg from '../assets/landing-bg.png'

export function LandingPage() {
  return (
    <div className="landing-page" style={{ '--bgimg': `url(${bg})` }}>
      <header className="landing-nav">
        <Link to="/" className="landing-brand">
          <img src={logo} alt="PaperPilot" style={{ width: 60, height: 60 }} />
          <span>PaperPilot</span>
        </Link>
        <div className="hero-actions">
          <Link to="/login" className="btn btn-light">Sign in</Link>
        </div>
      </header>

      <section className="landing-hero">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
          <p className="kicker">Research Workflow</p>
          <h1>Minimal workspace for papers, tags, notes, and decisions.</h1>
          <p className="hero-copy">Track literature, auto-suggest keyphrases, and keep your reading pipeline organized.</p>
          <div className="hero-actions">
            <Link to="/login" className="btn">Get started</Link>
          </div>
        </motion.div>
      </section>

      <section id="sections" className="landing-sections">
        <motion.article className="card" initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h3>Capture</h3>
          <p>Add title, abstract, authors, links, and status in one pass.</p>
        </motion.article>
        <motion.article className="card" initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.05 }}>
          <h3>Auto-tag</h3>
          <p>Suggest keywords from abstracts using local AI keyphrase extraction.</p>
        </motion.article>
        <motion.article className="card" initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
          <h3>Review</h3>
          <p>Filter by status, author, year, and tags to build focused reading lists.</p>
        </motion.article>
      </section>

      <section className="workflow-row">
        <div className="wf-item"><span>01</span>Paste abstract</div>
        <div className="wf-item"><span>02</span>Generate keyphrases</div>
        <div className="wf-item"><span>03</span>Edit tags</div>
        <div className="wf-item"><span>04</span>Track progress</div>
      </section>

      <footer className="landing-footer">
        <p>PaperPilot • AI Assisted Research Paper Tracker</p>
      </footer>
    </div>
  )
}
