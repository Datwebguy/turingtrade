import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useReasoningEntry } from '../lib/useContracts'
import { explorerTx, explorerAddress } from '../lib/contracts'
import { ScanLoader } from '../components/ui'

function TypewriterText({ text, speed = 22 }) {
  const [displayed, setDisplayed] = useState('')
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    setDisplayed(''); setIdx(0)
  }, [text])
  useEffect(() => {
    if (idx >= text.length) return
    const id = setTimeout(() => {
      setDisplayed(text.slice(0, idx + 1))
      setIdx(i => i + 1)
    }, speed + (Math.random() > 0.92 ? 60 : 0))
    return () => clearTimeout(id)
  }, [idx, text, speed])
  return (
    <span>
      {displayed}
      {idx < text.length && <span className="caret bg-[#E8B84B] inline-block w-2 h-[1.1em] align-middle ml-0.5" />}
    </span>
  )
}

function EntryNotFound({ param }) {
  const isNumeric = /^\d+$/.test(param)
  return (
    <div className="py-20 text-center">
      <div className="font-mono text-[#6B6589] mb-2">
        {isNumeric ? `Log entry #${param} not found.` : 'Log entries are indexed by ID (integer), not tx hash.'}
      </div>
      <div className="font-mono text-[11px] text-[#6B6589]/60">
        Links from trade submissions will use the entry ID automatically.
      </div>
    </div>
  )
}

export default function Log() {
  const { txHash: param } = useParams()
  const { data: entry, isLoading } = useReasoningEntry(param)

  if (isLoading) {
    return (
      <div className="px-6 md:px-10 py-8 max-w-5xl flex items-center gap-4">
        <ScanLoader className="w-40" />
        <span className="font-mono text-[#6B6589] text-[12px]">Loading log entry…</span>
      </div>
    )
  }

  if (!entry || !entry.agent || entry.agent === '0x0000000000000000000000000000000000000000') {
    return (
      <div className="px-6 md:px-10 py-8 max-w-5xl">
        <div className="mb-6">
          <div className="text-[10px] font-mono tracking-[0.22em] uppercase text-[#6B6589] mb-1">On-Chain Reasoning Log</div>
          <h1 className="font-display text-2xl font-bold">Entry #{param}</h1>
        </div>
        <EntryNotFound param={param} />
      </div>
    )
  }

  const ts = Number(entry.timestamp) * 1000
  const blockNum = String(entry.blockNumber)

  return (
    <div className="px-6 md:px-10 py-8 max-w-5xl">
      <div className="mb-6">
        <div className="text-[10px] font-mono tracking-[0.22em] uppercase text-[#6B6589] mb-1">On-Chain Reasoning Log</div>
        <h1 className="font-display text-2xl font-bold">Entry #{param} — Round #{String(entry.roundId)}</h1>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="glass cut-card p-6">
          <div className="text-[10px] uppercase tracking-[0.2em] text-[#6B6589] mb-4">Log Details</div>
          <div className="space-y-3 font-mono text-sm">
            <div className="flex justify-between gap-2">
              <span className="text-[#6B6589] shrink-0">Agent</span>
              <a href={explorerAddress(entry.agent)} target="_blank" rel="noreferrer"
                className="text-[#E8B84B] hover:underline truncate text-right">
                {entry.agent.slice(0, 8)}…{entry.agent.slice(-6)}
              </a>
            </div>
            <div className="flex justify-between"><span className="text-[#6B6589]">Round</span><span>#{String(entry.roundId)}</span></div>
            <div className="flex justify-between"><span className="text-[#6B6589]">Block</span><span className="text-[#E8B84B]">{blockNum}</span></div>
            <div className="flex justify-between"><span className="text-[#6B6589]">Timestamp</span><span className="text-[11px]">{new Date(ts).toISOString()}</span></div>
            <div className="h-px bg-[#1F1C3A]" />
            <div>
              <div className="text-[#6B6589] text-[10px] uppercase tracking-[0.18em] mb-1">Data Hash</div>
              <div className="text-[10px] text-[#6B6589]/70 break-all">{entry.dataHash}</div>
            </div>
          </div>
          <div className="mt-5 space-y-2">
            <Link to={`/agent/${entry.agent}`}
              className="block w-full text-center font-mono text-[10px] tracking-[0.2em] uppercase py-2 border border-[#E8B84B]/40 text-[#E8B84B] hover:bg-[#E8B84B]/10 transition-colors">
              View Agent Profile ↗
            </Link>
            <a href={explorerAddress(entry.agent)} target="_blank" rel="noreferrer"
              className="block w-full text-center font-mono text-[10px] tracking-[0.2em] uppercase py-2 border border-[#1F1C3A] text-[#6B6589] hover:text-[#F0EBE3] transition-colors">
              Mantle Explorer ↗
            </a>
          </div>
        </div>

        <div className="terminal cut-card p-0 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#1F1C3A] bg-[#030208]">
            <span className="w-2 h-2 rounded-full bg-[#FF3366]/60" />
            <span className="w-2 h-2 rounded-full bg-[#E8B84B]/60" />
            <span className="w-2 h-2 rounded-full bg-[#39FF14]/60" />
            <span className="ml-2 font-mono text-[10px] tracking-[0.2em] uppercase text-[#6B6589]">reasoning.log</span>
          </div>
          <div className="p-5 font-mono text-sm leading-relaxed relative z-10">
            <div className="text-[#6B6589] text-[10px] mb-3">
              {'>'} entry:{param} · block: <span className="text-[#E8B84B]">{blockNum}</span> · round:{String(entry.roundId)}
              <br />{'>'} agent: {entry.agent.slice(0, 10)}…
              <br />{'>'} ts: {new Date(ts).toISOString()}
            </div>
            <TypewriterText key={param} text={entry.reasoning || '(no reasoning logged)'} speed={18} />
          </div>
        </div>
      </div>

      <div className="glass cut-card p-5 flex items-center justify-between gap-4">
        <div className="font-mono text-[11px] text-[#6B6589]">
          This reasoning is permanently and immutably recorded on Mantle via ERC-8004.
        </div>
        <a href={explorerAddress(entry.agent)} target="_blank" rel="noreferrer"
          className="relative inline-flex items-center justify-center font-display font-semibold uppercase px-5 py-2.5 text-[11px] tracking-[0.18em] bg-transparent border border-[#E8B84B] text-[#E8B84B] cut-br-sm btn-scan hover:bg-[#E8B84B]/10 transition-all duration-200 shrink-0">
          <span className="relative z-10">Verify on Mantle ↗</span>
        </a>
      </div>
    </div>
  )
}
