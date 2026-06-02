import { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatEther } from 'viem'
import { useAccount, useWaitForTransactionReceipt } from 'wagmi'
import { Card, Badge, FlipCountdown, StatBox, SectionTitle, ScanLoader } from '../components/ui'
import { useRoundCount, useRound, useParticipant, useTradeEvents, useContractOwner, useCreateRound, ROUND_STATE } from '../lib/useContracts'
import { explorerTx } from '../lib/contracts'

function StatusBadge({ state, startTime }) {
  const now = Math.floor(Date.now() / 1000)
  let label, cls
  if (state === ROUND_STATE.Closed) {
    label = 'CLOSED'; cls = 'text-[#6B6589] border-[#6B6589]'
  } else if (state === ROUND_STATE.Active || state === ROUND_STATE.Finalizing) {
    label = state === ROUND_STATE.Finalizing ? 'FINALIZING' : 'LIVE'
    cls = 'bg-[#FF3366] text-white border-[#FF3366]'
  } else {
    label = Number(startTime) > now ? 'STARTING SOON' : 'OPEN'
    cls = Number(startTime) > now ? 'bg-[#E8B84B] text-[#06050F] border-[#E8B84B]' : 'text-[#4DFFEA] border-[#4DFFEA]'
  }
  const live = state === ROUND_STATE.Active || (state === ROUND_STATE.Open && Number(startTime) > now)
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono tracking-[0.18em] uppercase border ${cls}`}>
      {live && (
        <span className="relative inline-block w-1.5 h-1.5">
          <span className={`absolute inset-0 pulse-dot ${state === ROUND_STATE.Active ? 'bg-white' : 'bg-[#06050F]'}`} />
        </span>
      )}
      {label}
    </span>
  )
}

function ParticipantCount({ roundId, list }) {
  const { address } = useAccount()
  const count = list?.length ?? 0
  return (
    <div className="min-w-[100px]">
      <div className="text-[10px] uppercase tracking-[0.2em] text-[#6B6589]">Participants</div>
      <div className="font-mono text-sm font-bold mt-1">
        <span className="text-[#F0EBE3]">{count}</span>
        <span className="text-[#6B6589] text-[10px] ml-1">entered</span>
      </div>
    </div>
  )
}

function RoundRow({ roundId }) {
  const { data: round, isLoading, isError } = useRound(roundId)

  if (isLoading) {
    return (
      <div className="glass cut-card p-5 flex items-center gap-3">
        <ScanLoader />
        <div className="font-mono text-[11px] text-[#6B6589]">Loading round #{String(roundId)}...</div>
      </div>
    )
  }

  if (isError || !round) {
    return (
      <div className="glass cut-card p-5 font-mono text-[11px] text-[#FF3366]">
        Failed to load round #{String(roundId)} — check RPC connection.
      </div>
    )
  }

  const state = Number(round.state)
  if (state === ROUND_STATE.Closed) {
    return (
      <div className="glass cut-card p-5 flex items-center justify-between opacity-50">
        <div className="flex items-center gap-4 pl-2">
          <div className="font-display text-3xl tabular-nums text-[#6B6589]"><span className="text-[#6B6589]">#</span>{String(roundId)}</div>
          <span className="font-mono text-[10px] tracking-[0.18em] uppercase border px-2 py-0.5 text-[#6B6589] border-[#6B6589]">CLOSED</span>
        </div>
        <Link to={`/results/${roundId}`} className="font-mono text-[11px] tracking-[0.18em] uppercase text-[#E8B84B] border border-[#E8B84B]/40 px-3 py-1.5 hover:bg-[#E8B84B]/10">
          View Results →
        </Link>
      </div>
    )
  }

  const endsAt = Number(round.endTime) * 1000
  const startTime = Number(round.startTime)
  const isLive = state === ROUND_STATE.Active
  const isSoon = state === ROUND_STATE.Open && startTime > Math.floor(Date.now() / 1000)
  const accentColor = isLive ? '#FF3366' : isSoon ? '#E8B84B' : '#4DFFEA'
  const prizeEth = parseFloat(formatEther(round.prizePool)).toFixed(3)
  const feeEth   = parseFloat(formatEther(round.entryFee)).toFixed(3)

  return (
    <div className="tilt-host">
      <div className="relative glass cut-card tilt transition-all duration-200 p-5 flex flex-col md:flex-row items-stretch md:items-center gap-5"
        style={{ '--tx': '0deg', '--ty': '0deg', '--tilt-scale': '1' }}>
        <span className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: accentColor, boxShadow: `0 0 12px ${accentColor}88` }} />

        <div className="flex items-center gap-4 md:w-[200px] shrink-0 pl-2">
          <div className="font-display text-3xl tabular-nums">
            <span className="text-[#6B6589]">#</span>{String(roundId)}
          </div>
          <StatusBadge state={state} startTime={round.startTime} />
        </div>

        <div className="flex-1 grid gap-x-6 gap-y-3" style={{ gridTemplateColumns: 'repeat(4, minmax(100px, 1fr))' }}>
          <ParticipantCount roundId={roundId} list={round.participantList} />
          <div className="min-w-[100px]">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#6B6589]">{isLive ? 'Ends in' : 'Starts in'}</div>
            <div className="font-mono text-base font-bold mt-1">
              <FlipCountdown endsAt={isLive ? endsAt : Number(round.startTime) * 1000} />
            </div>
          </div>
          <div className="min-w-[100px]">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#6B6589]">Prize Pool</div>
            <div className="font-mono text-base font-bold mt-1 text-[#E8B84B]">{prizeEth} MNT</div>
          </div>
          <div className="min-w-[100px]">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#6B6589]">Entry Fee</div>
            <div className="font-mono text-base font-bold mt-1">{feeEth} MNT</div>
          </div>
        </div>

        <div className="shrink-0">
          <Link to={`/arena/${roundId}`}
            className="relative inline-flex items-center justify-center gap-2 font-display font-semibold uppercase px-5 py-3 text-[12px] tracking-[0.18em] bg-[#E8B84B] text-[#06050F] cut-br-sm btn-scan hover:shadow-[0_0_28px_-4px_rgba(232,184,75,0.7)] hover:-translate-y-0.5 transition-all duration-200">
            <span className="relative z-10">{isLive ? 'Enter / Trade →' : 'Enter Round →'}</span>
          </Link>
        </div>
        <div className="tilt-shine absolute inset-0 pointer-events-none" />
      </div>
    </div>
  )
}

function LiveFeed({ roundId }) {
  const [events, setEvents] = useState([])
  useTradeEvents(roundId, (log) => {
    const trader = log.args.trader ?? ''
    setEvents(prev => [{
      id: log.transactionHash,
      who: trader.slice(0, 6) + '…' + trader.slice(-4),
      action: `${log.args.isBuy ? 'BUY' : 'SELL'} ${log.args.pair ?? ''} · ${(Number(log.args.amountBps ?? 0) / 100).toFixed(1)}%`,
      tx: (log.transactionHash ?? '').slice(0, 10) + '…',
      txFull: log.transactionHash,
    }, ...prev].slice(0, 10))
  })

  if (!events.length) {
    return (
      <Card className="px-5 py-8 text-center">
        <div className="font-mono text-[11px] text-[#6B6589]">Watching for on-chain activity...</div>
        <ScanLoader className="mt-4 max-w-xs mx-auto" />
      </Card>
    )
  }

  return (
    <Card className="divide-y divide-[#1F1C3A]/60">
      {events.map((ev) => (
        <div key={ev.id} className="flex items-center gap-4 px-5 py-3 text-sm">
          <div className="w-7 h-7 flex items-center justify-center border text-sm border-[#E8B84B]/40 text-[#E8B84B]">
            ⚡
          </div>
          <div className="font-mono text-[12px] flex-1 truncate">{ev.who} <span className="text-[#6B6589]">·</span> {ev.action}</div>
          <a href={explorerTx(ev.txFull)} target="_blank" rel="noopener noreferrer"
            className="font-mono text-[11px] text-[#6B6589] hover:text-[#E8B84B] hidden md:block">{ev.tx}</a>
        </div>
      ))}
    </Card>
  )
}

function AdminCreateRound({ onCreated }) {
  const { address } = useAccount()
  const { data: owner } = useContractOwner()
  const { create, txHash, isPending, error } = useCreateRound()
  const { isSuccess } = useWaitForTransactionReceipt({ hash: txHash })
  const [fee, setFee]       = useState('0.1')
  const [hours, setHours]   = useState('1')

  const isOwner = owner && address && owner.toLowerCase() === address.toLowerCase()
  if (!isOwner) return null

  if (isSuccess) {
    onCreated?.()
    return (
      <div className="glass cut-card p-5 mb-4 border border-[#39FF14]/30 bg-[#39FF14]/5 font-mono text-[11px] text-[#39FF14]">
        Round created on-chain ✓ — it will appear below in a moment.
      </div>
    )
  }

  return (
    <div className="glass cut-card p-5 mb-4 border border-[#E8B84B]/30">
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#E8B84B] mb-3">Admin — Create New Round</div>
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#6B6589] mb-1">Entry Fee (MNT)</div>
          <input type="number" min="0.001" step="0.01" value={fee} onChange={e => setFee(e.target.value)}
            className="w-28 bg-[#06050F] border border-[#1F1C3A] px-3 py-2 font-mono text-sm text-[#F0EBE3] outline-none focus:border-[#E8B84B]/60" />
        </div>
        <div>
          <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#6B6589] mb-1">Duration (hours)</div>
          <input type="number" min="0.1" step="0.5" value={hours} onChange={e => setHours(e.target.value)}
            className="w-28 bg-[#06050F] border border-[#1F1C3A] px-3 py-2 font-mono text-sm text-[#F0EBE3] outline-none focus:border-[#E8B84B]/60" />
        </div>
        <button onClick={() => create(fee, parseFloat(hours))} disabled={isPending}
          className="relative inline-flex items-center justify-center font-display font-semibold uppercase px-5 py-2.5 text-[11px] tracking-[0.18em] bg-[#E8B84B] text-[#06050F] cut-br-sm btn-scan hover:shadow-[0_0_28px_-4px_rgba(232,184,75,0.7)] transition-all duration-200 disabled:opacity-50">
          <span className="relative z-10">{isPending ? 'Creating…' : '+ Create Round →'}</span>
        </button>
      </div>
      {error && <div className="font-mono text-[10px] text-[#FF3366] mt-2">{error.shortMessage || error.message}</div>}
      <div className="font-mono text-[9px] text-[#6B6589] mt-2">Starts in 60 seconds · keeper bot will activate and finalize automatically</div>
    </div>
  )
}

export default function Lobby() {
  const { data: rawCount, isLoading: countLoading, isError: countError, refetch } = useRoundCount()
  const roundCount = rawCount != null ? Number(rawCount) : 0

  const roundIds = Array.from({ length: roundCount }, (_, i) => i)
  const latestActiveRound = roundCount > 0 ? roundCount - 1 : null

  return (
    <div className="px-6 md:px-10 py-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-[10px] font-mono tracking-[0.22em] uppercase text-[#6B6589]">Arena</div>
          <h1 className="font-display text-3xl md:text-4xl flex items-center gap-3">
            Active Rounds
            <span className="relative inline-flex w-2 h-2">
              <span className="absolute inset-0 bg-[#39FF14] pulse-dot" />
            </span>
          </h1>
        </div>
        <Link to="/enter"
          className="relative inline-flex items-center justify-center gap-2 font-display font-semibold uppercase px-4 py-2 text-[11px] tracking-[0.16em] bg-transparent border border-[#E8B84B] text-[#E8B84B] cut-br-sm btn-scan hover:bg-[#E8B84B]/10 transition-all duration-200 hidden md:inline-flex">
          <span className="relative z-10">▷ Quick Match</span>
        </Link>
      </div>

      <AdminCreateRound onCreated={() => setTimeout(refetch, 4000)} />

      <div className="flex flex-col gap-4">
        {countLoading && (
          <div className="glass cut-card p-8 text-center">
            <ScanLoader />
            <div className="font-mono text-[11px] text-[#6B6589] mt-3">Fetching rounds from Mantle...</div>
          </div>
        )}
        {countError && (
          <div className="glass cut-card p-8 text-center font-mono text-[#FF3366] text-sm">
            Failed to reach Mantle Sepolia — check your network or RPC connection.
          </div>
        )}
        {!countLoading && !countError && roundCount === 0 && (
          <div className="glass cut-card p-8 text-center font-mono text-[#6B6589] text-sm">
            No rounds yet — create one above to get started.
          </div>
        )}
        {roundIds.map(id => <RoundRow key={id} roundId={id} />)}
      </div>

      <div className="mt-12">
        <SectionTitle className="mb-4" live>Recent On-Chain Activity</SectionTitle>
        <LiveFeed roundId={latestActiveRound} />
      </div>
    </div>
  )
}
