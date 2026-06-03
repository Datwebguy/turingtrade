import { useState, useEffect, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { Card, ScanLoader } from '../components/ui'
import { useMyAgent, useAgent, useAgentReputation, useAgentRoundLogs, useReasoningEntry, useRoundCount } from '../lib/useContracts'
import { explorerAddress, explorerTx, CONTRACTS } from '../lib/contracts'

function ReputationBar({ score }) {
  const [w, setW] = useState(0)
  const ref = useRef(null)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setW(score) }, { threshold: 0.3 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [score])
  return (
    <div ref={ref}>
      <div className="flex items-center justify-between mb-2 font-mono text-[11px]">
        <span className="text-[#6B6589] uppercase tracking-[0.18em]">On-Chain Reputation Score</span>
        <span className="text-[#E8B84B] font-bold">{score}/100</span>
      </div>
      <div className="relative h-2 bg-[#06050F] border border-[#1F1C3A] overflow-hidden">
        <div className="absolute inset-y-0 left-0 bg-[#E8B84B] transition-[width] duration-[1200ms] ease-out"
          style={{ width: `${w}%`, boxShadow: '0 0 12px rgba(232,184,75,0.55)' }} />
      </div>
    </div>
  )
}

function LogRow({ entryId }) {
  const { data: entry } = useReasoningEntry(entryId)
  if (!entry) return null
  const isBuy = entry.reasoning?.toLowerCase().includes('buy') || entry.reasoning?.toLowerCase().includes('long')
  return (
    <div className="flex items-center gap-4 px-5 py-3 hover:bg-[#E8B84B]/5 transition-colors border-b border-[#1F1C3A]">
      <span className={`font-mono text-[11px] font-bold w-10 ${isBuy ? 'text-[#39FF14]' : 'text-[#FF3366]'}`}>
        {isBuy ? 'BUY' : 'SELL'}
      </span>
      <span className="font-mono text-[11px] text-[#F0EBE3]/70 flex-1 truncate">
        {entry.reasoning?.slice(0, 60)}…
      </span>
      <span className="font-mono text-[10px] text-[#6B6589]">
        {new Date(Number(entry.timestamp) * 1000).toLocaleDateString()}
      </span>
      <Link to={`/log/${entryId}`} className="font-mono text-[10px] text-[#E8B84B] hover:underline shrink-0">↗</Link>
    </div>
  )
}

function AgentLogs({ owner, roundId }) {
  const { data: ids } = useAgentRoundLogs(owner, roundId)
  if (!ids?.length) return <div className="px-5 py-4 font-mono text-[11px] text-[#6B6589]">No logs for this round.</div>
  return ids.slice().reverse().map(id => <LogRow key={String(id)} entryId={String(id)} />)
}

function AgentLogsPanel({ owner }) {
  const { data: rawCount } = useRoundCount()
  const roundCount = rawCount != null ? Number(rawCount) : 0
  const latestRound = roundCount > 0 ? roundCount - 1 : 0
  const [selectedRound, setSelectedRound] = useState(null)
  const roundId = selectedRound ?? latestRound

  const rounds = Array.from({ length: roundCount }, (_, i) => i).reverse()

  return (
    <div className="glass cut-card overflow-hidden">
      <div className="px-5 py-3 border-b border-[#1F1C3A] flex items-center justify-between gap-4 flex-wrap">
        <div className="font-display font-semibold">On-Chain Reasoning Log — Round #{roundId}</div>
        {roundCount > 1 && (
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-[#6B6589] uppercase tracking-[0.15em]">Round:</span>
            <div className="flex items-center gap-1">
              {rounds.map(r => (
                <button key={r} onClick={() => setSelectedRound(r)}
                  className={`w-7 h-7 font-mono text-[10px] border transition-colors ${r === roundId ? 'border-[#E8B84B] text-[#E8B84B] bg-[#E8B84B]/10' : 'border-[#1F1C3A] text-[#6B6589] hover:border-[#6B6589]'}`}>
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <AgentLogs owner={owner} roundId={roundId} />
    </div>
  )
}

function AgentView({ tokenId }) {
  const { data: agent, isLoading } = useAgent(tokenId)
  const { data: reputation } = useAgentReputation(tokenId)

  if (isLoading || !agent) {
    return (
      <div className="flex items-center justify-center py-20">
        <ScanLoader className="w-40" />
      </div>
    )
  }

  if (!agent.owner || agent.owner === '0x0000000000000000000000000000000000000000') {
    return (
      <div className="py-20 text-center font-mono text-[#FF3366]">Agent #{tokenId} not found.</div>
    )
  }

  const roundsEntered = Number(agent.roundsEntered)
  const roundsWon     = Number(agent.roundsWon)
  const totalRoiBps   = Number(agent.totalRoi)
  const winRate       = roundsEntered > 0 ? ((roundsWon / roundsEntered) * 100).toFixed(1) : '—'
  const avgRoi        = roundsEntered > 0 ? (totalRoiBps / roundsEntered / 100).toFixed(2) : '—'
  const score         = Number(reputation ?? 0)
  const registeredDate = new Date(Number(agent.registeredAt) * 1000).toLocaleDateString()

  const stats = [
    { label: 'Rounds Entered', value: roundsEntered },
    { label: 'Rounds Won',     value: roundsWon },
    { label: 'Win Rate',       value: roundsEntered > 0 ? `${winRate}%` : '—', cls: 'text-[#39FF14]' },
    { label: 'Avg ROI',        value: roundsEntered > 0 ? `${Number(avgRoi) >= 0 ? '+' : ''}${avgRoi}%` : '—', cls: Number(avgRoi) >= 0 ? 'text-[#39FF14]' : 'text-[#FF3366]' },
    { label: 'Total ROI',      value: roundsEntered > 0 ? `${totalRoiBps >= 0 ? '+' : ''}${(totalRoiBps / 100).toFixed(2)}%` : '—', cls: totalRoiBps >= 0 ? 'text-[#39FF14]' : 'text-[#FF3366]' },
    { label: 'Registered',     value: registeredDate, cls: 'text-[11px]' },
  ]

  return (
    <>
      <div className="glass cut-card p-0 overflow-hidden mb-6" style={{ background: 'linear-gradient(135deg, #0D0C1E 0%, #15132A 60%, #1a1030 100%)' }}>
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 p-7">
          <div className="w-24 h-24 border-2 border-[#E8B84B] flex items-center justify-center text-5xl bg-[#06050F] shrink-0">🤖</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h1 className="font-display text-3xl font-bold">{agent.name}</h1>
              <span className="font-mono text-[11px] px-2 py-0.5 border border-[#E8B84B]/40 text-[#E8B84B]">ERC-8004 #{tokenId}</span>
            </div>
            <div className="font-mono text-[11px] text-[#6B6589] mb-3 truncate">
              Owner: <a href={explorerAddress(agent.owner)} target="_blank" rel="noreferrer"
                className="text-[#E8B84B] hover:underline">{agent.owner}</a>
            </div>
            {agent.strategyHash && (
              <div className="font-mono text-[11px] text-[#6B6589] bg-[#06050F] border border-[#1F1C3A] px-3 py-2 max-w-md">
                {agent.strategyHash.slice(0, 120)}{agent.strategyHash.length > 120 ? '…' : ''}
              </div>
            )}
          </div>
          <div className="shrink-0">
            <a href={explorerAddress(CONTRACTS.AgentRegistry)} target="_blank" rel="noreferrer"
              className="relative inline-flex items-center justify-center font-display font-semibold uppercase px-5 py-2.5 text-[11px] tracking-[0.18em] bg-[#E8B84B] text-[#06050F] cut-br-sm btn-scan hover:shadow-[0_0_28px_-4px_rgba(232,184,75,0.7)] transition-all duration-200">
              <span className="relative z-10">View on Explorer ↗</span>
            </a>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
        {stats.map((s, i) => (
          <div key={i} className="glass cut-br-sm p-3 text-center">
            <div className="text-[9px] uppercase tracking-[0.2em] text-[#6B6589] mb-1">{s.label}</div>
            <div className={`font-mono text-lg font-bold ${s.cls || ''}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="glass cut-card p-6 mb-6">
        <ReputationBar score={score} />
        <div className="mt-2 font-mono text-[10px] text-[#6B6589]">
          Score: win rate + avg ROI + longevity (0–100)
        </div>
      </div>

      <AgentLogsPanel owner={agent.owner} />
    </>
  )
}

function MyAgentRedirect() {
  const { address } = useAccount()
  const { data: tokenId, isLoading } = useMyAgent()

  if (!address) return <div className="py-20 text-center font-mono text-[#6B6589]">Connect wallet to view your agent.</div>
  if (isLoading) return <div className="flex items-center justify-center py-20"><ScanLoader className="w-40" /></div>
  if (!tokenId || tokenId === 0n) {
    return (
      <div className="py-20 text-center">
        <div className="font-mono text-[#6B6589] mb-4">You don't have an agent yet.</div>
        <Link to="/enter"
          className="relative inline-flex items-center justify-center font-display font-semibold uppercase px-6 py-3 text-[12px] tracking-[0.18em] bg-[#FF3366] text-white cut-br-sm btn-scan hover:shadow-[0_0_28px_-4px_rgba(255,51,102,0.7)] transition-all duration-200">
          <span className="relative z-10">Register Your Agent →</span>
        </Link>
      </div>
    )
  }
  return <AgentView tokenId={String(tokenId)} />
}

export default function Profile() {
  const { id } = useParams()
  return (
    <div className="px-6 md:px-10 py-8 max-w-5xl">
      <div className="mb-6">
        <div className="text-[10px] font-mono tracking-[0.22em] uppercase text-[#6B6589]">Agent Profile</div>
        <h1 className="font-display text-3xl font-bold">
          {id === 'me' ? 'My Agent' : `Agent #${id}`}
        </h1>
      </div>
      {id === 'me' ? <MyAgentRedirect /> : <AgentView tokenId={id} />}
    </div>
  )
}
