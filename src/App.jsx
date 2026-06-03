import { useState, Component } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(error) { return { error } }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center p-8">
          <div className="glass cut-card p-10 max-w-md w-full text-center">
            <div className="text-5xl mb-4">⚠</div>
            <h2 className="font-display text-xl font-bold text-[#FF3366] mb-2">Something went wrong</h2>
            <p className="font-mono text-[11px] text-[#6B6589] mb-6">
              An unexpected error occurred. Try refreshing the page — if it keeps happening, check your wallet connection and network.
            </p>
            <button onClick={() => window.location.reload()}
              className="relative inline-flex items-center justify-center font-display font-semibold uppercase px-6 py-3 text-[12px] tracking-[0.18em] bg-[#E8B84B] text-[#06050F] cut-br-sm hover:shadow-[0_0_28px_-4px_rgba(232,184,75,0.7)] transition-all duration-200">
              Refresh Page →
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
import ArenaBackground from './components/ArenaBackground'
import Navbar from './components/Navbar'
import IntroSequence from './components/Intro'
import Landing from './pages/Landing'
import Roles from './pages/Roles'
import Lobby from './pages/Lobby'
import Arena from './pages/Arena'
import Profile from './pages/Profile'
import Log, { LogBrowse } from './pages/Log'
import Results from './pages/Results'

function AppShell() {
  const { pathname } = useLocation()
  const isStandalone = pathname === '/' || pathname === '/enter'
  const [introActive, setIntroActive] = useState(() => {
    if (pathname !== '/') return false
    try { return !sessionStorage.getItem('tt-intro-seen') } catch { return true }
  })

  return (
    <>
      <ArenaBackground />
      {!isStandalone && <Navbar />}
      <div className={`relative z-10 min-h-screen ${!isStandalone ? 'pt-14 md:pt-0 md:pl-[220px]' : ''}`}>
        <ErrorBoundary>
        <div key={pathname} className="page-enter page-enter-active">
          <Routes>
            <Route path="/"            element={<Landing />} />
            <Route path="/enter"       element={<Roles />} />
            <Route path="/lobby"       element={<Lobby />} />
            <Route path="/arena/:id"   element={<Arena />} />
            <Route path="/agent/:id"   element={<Profile />} />
            <Route path="/log"          element={<LogBrowse />} />
            <Route path="/log/:txHash" element={<Log />} />
            <Route path="/results/:id" element={<Results />} />
            <Route path="*"            element={<Landing />} />
          </Routes>
        </div>
        </ErrorBoundary>
      </div>
      {pathname === '/' && introActive && (
        <IntroSequence onDone={() => {
          try { sessionStorage.setItem('tt-intro-seen', '1') } catch {}
          setIntroActive(false)
        }} />
      )}
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  )
}
