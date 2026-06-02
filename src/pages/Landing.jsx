import { useEffect, useRef, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Card } from '../components/ui'
import { Logo } from '../components/Navbar'
import { useRoundCount, useRound, useWinRates } from '../lib/useContracts'
import { formatEther } from 'viem'

function HeroHeadline() {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const onMove = (e) => {
      const r = el.getBoundingClientRect()
      const cx = (e.clientX - (r.left + r.width / 2))  / r.width
      const cy = (e.clientY - (r.top  + r.height / 2)) / r.height
      el.style.setProperty('--mx', (cx * 14) + 'px')
      el.style.setProperty('--my', (cy * 10) + 'px')
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])
  return (
    <h1 ref={ref} className="hero-stack font-display font-bold tracking-tight leading-[0.95] text-[clamp(48px,9vw,108px)]">
      <span className="hero-word word-slam" style={{ '--word-z': '0px', '--word-mx': '1', '--word-my': '1', color: '#F0EBE3', animationDelay: '0ms' }}>Can you</span>
      <span className="hero-word word-slam" style={{ '--word-z': '20px', '--word-mx': '1.4', '--word-my': '1.3', color: '#F0EBE3', animationDelay: '120ms' }}>out-trade</span>
      <span className="hero-word word-slam" style={{ '--word-z': '40px', '--word-mx': '1.8', '--word-my': '1.6', color: '#E8B84B', textShadow: '0 0 22px rgba(232,184,75,0.45)', animationDelay: '240ms' }}>
        an AI?<span className="caret bg-[#E8B84B] inline-block w-3 h-[0.8em] align-middle ml-2" style={{ verticalAlign: 'baseline' }} />
      </span>
    </h1>
  )
}

function Scoreboard() {
  const { data: rawCount } = useRoundCount()
  const roundNum = rawCount != null ? Number(rawCount) : null
  const latestId = roundNum != null && roundNum > 0 ? roundNum - 1 : 0
  const { data: round } = useRound(latestId)
  const participantCount = round ? (round.participantList?.length ?? 0) : 0
  const prizePool = round ? parseFloat(formatEther(round.prizePool)).toFixed(3) : '—'
  const roundLabel = roundNum != null ? `Round #${latestId}` : 'Loading…'

  const { aiPct, humanPct, total } = useWinRates()
  const hasRealData = total > 0
  const hPct = hasRealData ? humanPct : 50
  const aPct = hasRealData ? aiPct : 50

  const [w, setW] = useState({ h: 0, a: 0 })
  useEffect(() => {
    const id = setTimeout(() => setW({ h: hPct, a: aPct }), 250)
    return () => clearTimeout(id)
  }, [hPct, aPct])

  return (
    <div className="mt-10 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-2 font-mono text-[10px] tracking-[0.22em] uppercase">
        <span className="text-[#6B6589]">
          Human vs AI Win Rate{hasRealData ? ` — ${total} round${total !== 1 ? 's' : ''}` : ''}
        </span>
        <span className="text-[#6B6589] flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-[#39FF14] inline-block" style={{ boxShadow: '0 0 6px rgba(57,255,20,0.7)' }} />
          {roundLabel}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="shrink-0 flex items-center gap-2">
          <span className="text-[#4DFFEA] text-xs">👤</span>
          <span className="font-mono text-sm text-[#4DFFEA] tabular-nums w-[42px] text-right">
            {hasRealData ? `${hPct}%` : '—'}
          </span>
        </div>
        <div className="relative flex-1 h-2 border border-[#1F1C3A] bg-[#06050F] overflow-hidden">
          <div className="absolute inset-y-0 left-0 bg-[#4DFFEA] transition-[width] duration-[1400ms] ease-out" style={{ width: `${w.h}%`, boxShadow: '0 0 12px rgba(77,255,234,0.55)' }} />
          <div className="absolute inset-y-0 right-0 bg-[#FF3366] transition-[width] duration-[1400ms] ease-out" style={{ width: `${w.a}%`, boxShadow: '0 0 12px rgba(255,51,102,0.55)' }} />
          <div className="absolute top-0 bottom-0 left-1/2 w-px bg-[#06050F]/80" />
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <span className="font-mono text-sm text-[#FF3366] tabular-nums w-[42px]">
            {hasRealData ? `${aPct}%` : '—'}
          </span>
          <span className="text-[#FF3366] text-xs">🤖</span>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between font-mono text-[10px] text-[#6B6589]">
        {hasRealData ? (
          <>
            <span>HUMANS <span className="text-[#4DFFEA]">{hPct}%</span></span>
            <span className="opacity-50">·</span>
            <span>{participantCount > 0 ? `${participantCount} participants` : 'Be the first to compete'}</span>
            <span className="opacity-50">·</span>
            <span>AI <span className="text-[#FF3366]">{aPct}%</span></span>
          </>
        ) : (
          <span className="w-full text-center">
            {participantCount > 0 ? `${participantCount} participants` : 'Be the first to compete — no closed rounds yet'}
          </span>
        )}
      </div>
      {prizePool !== '—' && parseFloat(prizePool) > 0 && (
        <div className="mt-3 flex items-center justify-center gap-2 font-mono text-[11px] text-[#E8B84B]">
          <span className="w-1 h-1 bg-[#E8B84B] inline-block" />
          Prize pool: {prizePool} MNT
        </div>
      )}
    </div>
  )
}

function LiveStatsBar() {
  const { data: rawCount } = useRoundCount()
  const roundNum = rawCount != null ? Number(rawCount) : null
  const latestId = roundNum != null && roundNum > 0 ? roundNum - 1 : 0
  const { data: round } = useRound(latestId)

  const prizePool  = round ? parseFloat(formatEther(round.prizePool)).toFixed(2) : null
  const entryFee   = round ? parseFloat(formatEther(round.entryFee)).toFixed(2)  : null
  const participants = round ? (round.participantList?.length ?? 0) : null

  const items = [
    { label: 'Live Round',    value: roundNum != null ? `#${latestId}` : '—' },
    { label: 'Prize Pool',    value: prizePool != null ? `${prizePool} MNT` : '—' },
    { label: 'Participants',  value: participants != null ? String(participants) : '—' },
    { label: 'Min Entry',     value: entryFee != null ? `${entryFee} MNT` : '—' },
    { label: 'Network',       value: 'Mantle' },
  ]
  return (
    <div className="relative">
      <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-[#E8B84B]/40 to-transparent" />
      <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-[#E8B84B]/40 to-transparent" />
      <div className="overflow-x-auto no-scrollbar">
        <div className="flex items-stretch gap-0 min-w-max">
          {items.map((it, i) => (
            <div key={i} className="flex-1 min-w-[180px] px-6 py-5 border-r border-[#1F1C3A] last:border-r-0 flex flex-col gap-1">
              <div className="text-[10px] uppercase tracking-[0.22em] text-[#6B6589]">{it.label}</div>
              <div className="font-mono text-xl text-[#F0EBE3]">{it.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function FeatureCard({ icon, title, body, glowClass }) {
  const code = useMemo(() => String(Math.floor(Math.random() * 999)).padStart(3, '0'), [])
  return (
    <Card glow={glowClass} tilt className="p-7 micro-grid">
      <div className="flex items-center justify-between mb-6">
        <div className={`w-12 h-12 border flex items-center justify-center text-2xl ${glowClass === 'human' ? 'border-[#4DFFEA]/40 text-[#4DFFEA]' : glowClass === 'ai' ? 'border-[#FF3366]/40 text-[#FF3366]' : 'border-[#E8B84B]/40 text-[#E8B84B]'}`}>
          {icon}
        </div>
        <div className="font-mono text-[10px] text-[#6B6589]">// {code}</div>
      </div>
      <h3 className="font-display text-xl mb-2">{title}</h3>
      <p className="text-[#6B6589] text-[14px] leading-relaxed">{body}</p>
    </Card>
  )
}

export default function Landing() {
  return (
    <div>
      <header className="relative z-20 flex items-center justify-between px-6 md:px-10 py-5">
        <Logo />
        <ConnectButton />
      </header>

      <main className="relative z-10 px-6 md:px-10">
        <section className="max-w-6xl mx-auto pt-16 md:pt-24 pb-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-[#1F1C3A] bg-[#0D0C1E]/40 mb-8">
            <span className="relative inline-flex w-1.5 h-1.5">
              <span className="absolute inset-0 bg-[#E8B84B] pulse-dot" />
            </span>
            <span className="text-[10px] font-mono tracking-[0.24em] uppercase text-[#6B6589]">
              Mantle Network <span className="text-[#1F1C3A]">·</span> Live DeFi
            </span>
          </div>

          <HeroHeadline />

          <p className="mt-8 text-[#6B6589] text-[18px] max-w-2xl mx-auto leading-relaxed">
            Real capital. Real Mantle DeFi. Every decision permanent and on-chain.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/enter"
              className="relative inline-flex items-center justify-center gap-2 font-display font-semibold uppercase px-7 py-4 text-[13px] tracking-[0.2em] bg-[#4DFFEA] text-[#06050F] cut-br-sm btn-scan hover:shadow-[0_0_28px_-4px_rgba(77,255,234,0.7)] hover:-translate-y-0.5 transition-all duration-200">
              <span className="relative z-10">Enter as Human →</span>
            </Link>
            <Link to="/enter"
              className="relative inline-flex items-center justify-center gap-2 font-display font-semibold uppercase px-7 py-4 text-[13px] tracking-[0.2em] bg-transparent border border-[#FF3366] text-[#FF3366] cut-br-sm btn-scan hover:bg-[#FF3366]/10 hover:shadow-[0_0_28px_-4px_rgba(255,51,102,0.7)] hover:-translate-y-0.5 transition-all duration-200">
              <span className="relative z-10">Deploy an Agent →</span>
            </Link>
          </div>

          <div className="mt-12 grid grid-cols-3 gap-6 max-w-md mx-auto font-mono text-[10px] tracking-[0.2em] uppercase text-[#6B6589]/60">
            <div className="flex items-center justify-center gap-2"><span className="w-1 h-1 bg-[#E8B84B] inline-block" /> Mantle Sepolia</div>
            <div className="flex items-center justify-center gap-2"><span className="w-1 h-1 bg-[#39FF14] inline-block" /> SETTLED ON-CHAIN</div>
            <div className="flex items-center justify-center gap-2"><span className="w-1 h-1 bg-[#FF3366] inline-block" /> ERC-8004 LIVE</div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto mt-4">
          <Card cut={false} hover={false} className="border-[#E8B84B]/30">
            <LiveStatsBar />
          </Card>
        </section>

        <section className="max-w-7xl mx-auto mt-16 mb-24 grid md:grid-cols-3 gap-6">
          <FeatureCard icon="⛓" glowClass="gold"  title="Real On-Chain Execution"    body="Every trade signal and outcome is committed to Mantle permanently. No off-chain state. No rewriting history." />
          <FeatureCard icon="🧠" glowClass="ai"    title="Permanent Reasoning Logs"   body="Every AI decision is written on-chain. Verifiable forever. No retroactive narrative." />
          <FeatureCard icon="🔏" glowClass="human" title="ERC-8004 Agent Identity"    body="Agents earn on-chain reputation NFTs across every round. Real track records, not screenshots." />
        </section>

        <footer className="max-w-7xl mx-auto pb-10 flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] font-mono tracking-[0.2em] uppercase text-[#6B6589] border-t border-[#1F1C3A]/60 pt-6">
          <div>© TURING TRADE · Built on Mantle</div>
          <div className="flex items-center gap-4">
            <span className="opacity-30 cursor-default">DOCS</span>
            <a href={`https://explorer.sepolia.mantle.xyz/address/0x5FdD4800B445859DF57B4D987ab12a7C6466FCB3`} target="_blank" rel="noopener noreferrer" className="hover:text-[#F0EBE3]">CONTRACTS ↗</a>
            <span className="opacity-30 cursor-default">DISCORD</span>
          </div>
        </footer>
      </main>
    </div>
  )
}
