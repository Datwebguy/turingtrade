import { useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useChainGuard, useRoundCount } from '../lib/useContracts'

function Logo({ small = false }) {
  return (
    <Link to="/" className="flex items-center gap-2 group">
      <svg width={small ? 22 : 28} height={small ? 22 : 28} viewBox="0 0 120 120" fill="none">
        {/* left half — teal organic */}
        <path d="M60 10 C46 8,32 14,24 26 C16 34,12 46,18 56 C12 66,18 80,30 88 C40 98,52 102,60 102 L60 10Z" stroke="#4DFFEA" strokeWidth="3" strokeLinecap="round"/>
        <circle cx="36" cy="34" r="3" fill="#4DFFEA"/>
        <circle cx="50" cy="50" r="3" fill="#4DFFEA"/>
        <circle cx="34" cy="64" r="3" fill="#4DFFEA"/>
        {/* right half — red angular */}
        <path d="M60 10 L76 10 L90 18 L100 30 L104 42 L100 54 L106 66 L98 82 L84 94 L70 100 L60 102Z" stroke="#FF3366" strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter"/>
        <polygon points="80,42 84,40 88,42 88,46 84,48 80,46" fill="#06050F" stroke="#FF3366" strokeWidth="1.5"/>
        {/* gold split line */}
        <line x1="60" y1="8" x2="60" y2="104" stroke="#E8B84B" strokeWidth="3"/>
        <circle cx="60" cy="8"   r="3.5" fill="#E8B84B"/>
        <circle cx="60" cy="104" r="3.5" fill="#E8B84B"/>
      </svg>
      <span className={`font-display font-bold tracking-wider ${small ? 'text-sm' : 'text-base'}`}>
        <span className="text-[#F0EBE3]">TURING</span>
        <span className="text-[#E8B84B]">TRADE</span>
      </span>
    </Link>
  )
}

const NAV_ITEMS = [
  { to: '/lobby',      label: 'LOBBY',       icon: '⊞' },
  { to: '/arena/0',    label: 'LIVE ARENA',  icon: '⚡' },
  { to: '/results/0',  label: 'RESULTS',     icon: '⬆' },
  { to: '/agent/me',   label: 'MY AGENT',    icon: '⚙' },
  { to: '/log/0',      label: 'ON-CHAIN LOG', icon: '◷' },
]

export default function Navbar() {
  const { pathname } = useLocation()
  const { isWrongChain, ensureChain } = useChainGuard()
  const { data: rawCount } = useRoundCount()
  const latestRound = rawCount != null ? Math.max(0, Number(rawCount) - 1) : 0
  const [drawerOpen, setDrawerOpen] = useState(false)

  const NAV = [
    { to: '/lobby',                 label: 'LOBBY',        icon: '⊞' },
    { to: `/arena/${latestRound}`,  label: 'LIVE ARENA',   icon: '⚡' },
    { to: `/results/${latestRound}`,label: 'RESULTS',      icon: '⬆' },
    { to: '/agent/me',              label: 'MY AGENT',     icon: '⚙' },
    { to: '/log',                   label: 'ON-CHAIN LOG', icon: '◷' },
  ]

  const NavLinks = ({ onClick }) => NAV.map(({ to, label, icon }) => {
    const base = '/' + to.split('/')[1]
    const active = pathname === to || (base !== '/' && pathname.startsWith(base))
    return (
      <Link key={label} to={to} onClick={onClick}
        className={`flex items-center gap-3 px-5 py-3 text-[11px] tracking-[0.18em] font-mono transition-all duration-150
          ${active ? 'nav-active' : 'text-[#6B6589] hover:text-[#F0EBE3] hover:bg-[#E8B84B]/5'}`}
      >
        <span className="text-base leading-none">{icon}</span>
        {label}
      </Link>
    )
  })

  const WrongChainBtn = ({ onClick }) => isWrongChain ? (
    <button onClick={() => { ensureChain(); onClick?.() }}
      className="mx-3 mb-2 flex items-center gap-2 px-3 py-2 font-mono text-[10px] tracking-[0.15em] uppercase border border-[#FF3366]/50 text-[#FF3366] bg-[#FF3366]/5 hover:bg-[#FF3366]/10 transition-colors">
      <span className="relative inline-block w-1.5 h-1.5"><span className="absolute inset-0 bg-[#FF3366] pulse-dot" /></span>
      Wrong chain — switch
    </button>
  ) : null

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-[220px] glass navbar-shimmer border-r border-[#1F1C3A] z-30 flex-col">
        <div className="p-5 pb-4 border-b border-[#1F1C3A]">
          <Logo small />
        </div>
        <nav className="flex-1 py-4 overflow-y-auto no-scrollbar">
          <NavLinks />
        </nav>
        <WrongChainBtn />
        <div className="p-4 border-t border-[#1F1C3A]">
          <ConnectButton showBalance={false} chainStatus="icon" accountStatus="avatar" />
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 glass navbar-shimmer border-b border-[#1F1C3A] z-30 flex items-center justify-between px-4">
        <button onClick={() => setDrawerOpen(true)} aria-label="Open menu"
          className="w-8 h-8 flex flex-col justify-center gap-[5px] shrink-0">
          <span className="block h-0.5 w-6 bg-[#F0EBE3]" />
          <span className="block h-0.5 w-6 bg-[#F0EBE3]" />
          <span className="block h-0.5 w-4 bg-[#F0EBE3]" />
        </button>
        <Logo small />
        <div className="shrink-0 scale-90 origin-right">
          <ConnectButton showBalance={false} chainStatus="none" accountStatus="avatar" />
        </div>
      </header>

      {/* Mobile drawer */}
      {drawerOpen && (
        <>
          <div className="md:hidden fixed inset-0 bg-black/60 z-40" onClick={() => setDrawerOpen(false)} />
          <nav className="md:hidden fixed top-0 left-0 bottom-0 w-[240px] glass border-r border-[#1F1C3A] z-50 flex flex-col">
            <div className="p-5 pb-4 border-b border-[#1F1C3A] flex items-center justify-between">
              <Logo small />
              <button onClick={() => setDrawerOpen(false)}
                className="font-mono text-[#6B6589] hover:text-[#F0EBE3] text-lg leading-none">✕</button>
            </div>
            <div className="flex-1 py-4 overflow-y-auto no-scrollbar">
              <NavLinks onClick={() => setDrawerOpen(false)} />
            </div>
            <WrongChainBtn onClick={() => setDrawerOpen(false)} />
          </nav>
        </>
      )}
    </>
  )
}

export { Logo }
