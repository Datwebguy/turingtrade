import { useState, Component } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(error) { return { error } }
  render() {
    if (this.state.error) {
      return (
        <div className="p-8 font-mono text-[#FF3366] text-sm whitespace-pre-wrap">
          <div className="text-lg mb-2">Runtime error (send this to dev):</div>
          {String(this.state.error)}
          {'\n\n'}
          {this.state.error?.stack}
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
import Log from './pages/Log'
import Results from './pages/Results'

function AppShell() {
  const { pathname } = useLocation()
  const isStandalone = pathname === '/' || pathname === '/enter'
  const [introActive, setIntroActive] = useState(pathname === '/')

  return (
    <>
      <ArenaBackground />
      {!isStandalone && <Navbar />}
      <div className={`relative z-10 min-h-screen ${!isStandalone ? 'pl-[220px]' : ''}`}>
        <ErrorBoundary>
        <div key={pathname} className="page-enter page-enter-active">
          <Routes>
            <Route path="/"            element={<Landing />} />
            <Route path="/enter"       element={<Roles />} />
            <Route path="/lobby"       element={<Lobby />} />
            <Route path="/arena/:id"   element={<Arena />} />
            <Route path="/agent/:id"   element={<Profile />} />
            <Route path="/log/:txHash" element={<Log />} />
            <Route path="/results/:id" element={<Results />} />
            <Route path="/leaderboard" element={<Lobby />} />
            <Route path="/history"     element={<Lobby />} />
            <Route path="*"            element={<Landing />} />
          </Routes>
        </div>
        </ErrorBoundary>
      </div>
      {pathname === '/' && introActive && (
        <IntroSequence onDone={() => setIntroActive(false)} />
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
