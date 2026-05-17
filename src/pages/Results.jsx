import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAccount, useWaitForTransactionReceipt, usePublicClient } from 'wagmi'
import { formatEther, parseAbiItem } from 'viem'
import { ScanLoader } from '../components/ui'
import { useRound, useParticipant, useParticipants, useClaimPrize, useContractOwner, useSubmitResults, ROUND_STATE, CHAIN } from '../lib/useContracts'
import { explorerAddress, explorerTx, CONTRACTS } from '../lib/contracts'

function ParticleBurst() {
  const [shards, setShards] = useState([])
  useEffect(() => {
    const colors = ['#E8B84B', '#FF3366', '#4DFFEA', '#39FF14']
    setShards(Array.from({ length: 24 }, (_, i) => ({
      id: i,
      color: colors[i % colors.length],
      tx: `${(Math.random() - 0.5) * 300}px`,
      ty: `${(Math.random() - 1) * 280}px`,
      rot: `${Math.random() * 720}deg`,
      w: 3 + Math.random() * 6,
      h: 3 + Math.random() * 6,
    })))
  }, [])
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      {shards.map(s => (
        <div key={s.id} className="shard absolute" style={{
          '--tx': s.tx, '--ty': s.ty, '--rot': s.rot,
          width: s.w, height: s.h, background: s.color,
          boxShadow: `0 0 6px ${s.color}`,
        }} />
      ))}
    </div>
  )
}

function YourResult({ roundId, winner }) {
  const { address } = useAccount()
  const { data: p } = useParticipant(roundId, address)
  const { claim, isPending, txHash, error } = useClaimPrize()
  const { isSuccess: claimed } = useWaitForTransactionReceipt({ hash: txHash })

  if (!address) return null
  const zeroAddr = '0x0000000000000000000000000000000000000000'
  if (!p || p.addr === zeroAddr) return (
    <div className="glass cut-card p-5 mb-6 font-mono text-[11px] text-[#6B6589]">
      You did not participate in this round.
    </div>
  )

  const roi = Number(p.roiBps) / 100
  const isWinner = address?.toLowerCase() === winner?.toLowerCase()
  const canClaim = isWinner && !p.claimed && !claimed

  return (
    <div className="glass cut-card p-5 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
      <div>
        <div className="text-[10px] font-mono tracking-[0.2em] uppercase text-[#6B6589] mb-1">Your Result</div>
        <div className="flex items-center gap-4 font-mono flex-wrap">
          <span className={`text-2xl font-bold ${roi >= 0 ? 'text-[#39FF14]' : 'text-[#FF3366]'}`}>
            {roi >= 0 ? '+' : ''}{roi.toFixed(2)}%
          </span>
          <span className="text-[#6B6589]">{p.isAI ? '🤖 AI' : '👤 Human'}</span>
          <span className="text-[#6B6589]">Trades: <span className="text-[#F0EBE3]">{String(p.tradeCount)}</span></span>
          {p.liquidated && <span className="text-[#FF3366] text-[11px]">Liquidated</span>}
          {(p.claimed || claimed) && <span className="text-[#39FF14] text-[11px]">Prize claimed ✓</span>}
        </div>
        {error && <div className="font-mono text-[10px] text-[#FF3366] mt-2">{error.shortMessage || error.message}</div>}
        {txHash && !claimed && <div className="font-mono text-[10px] text-[#6B6589] mt-1"><a href={explorerTx(txHash)} target="_blank" rel="noreferrer" className="hover:text-[#E8B84B]">tx pending ↗</a></div>}
      </div>
      {canClaim && (
        <button onClick={() => claim(roundId)} disabled={isPending}
          className="relative inline-flex items-center justify-center font-display font-semibold uppercase px-6 py-3 text-[12px] tracking-[0.18em] bg-[#39FF14] text-[#06050F] cut-br-sm btn-scan hover:shadow-[0_0_28px_-4px_rgba(57,255,20,0.7)] transition-all duration-200 disabled:opacity-50 shrink-0">
          <span className="relative z-10">{isPending ? 'Claiming…' : '🏆 Claim Prize →'}</span>
        </button>
      )}
    </div>
  )
}

const TRADE_EVENT = parseAbiItem('event TradeSubmitted(uint256 indexed roundId, address indexed trader, string pair, int256 amountBps, bool isBuy, uint256 logEntryId)')

function FinalizePanel({ roundId, participants, onFinalized }) {
  const { address } = useAccount()
  const { data: owner } = useContractOwner()
  const { submitResults, isPending, error, txHash } = useSubmitResults()
  const { isSuccess } = useWaitForTransactionReceipt({ hash: txHash })
  const publicClient = usePublicClient({ chainId: CHAIN.id })
  const [status, setStatus] = useState('')

  const isOwner = owner && address && owner.toLowerCase() === address.toLowerCase()
  if (!isOwner) return null

  const handleFinalize = async () => {
    try {
      setStatus('This round is handled automatically by the keeper bot. If it has not finalized yet, wait up to 60 seconds for the keeper to detect and submit results.')
    } catch (e) {
      setStatus('')
      console.error(e)
    }
  }

  if (isSuccess) {
    onFinalized?.()
    return (
      <div className="glass cut-card p-5 mb-6 border border-[#39FF14]/30 bg-[#39FF14]/5 text-center font-mono text-[#39FF14] text-[11px]">
        Round finalized on-chain ✓ — reloading results…
      </div>
    )
  }

  return (
    <div className="glass cut-card p-5 mb-6 border border-[#E8B84B]/30">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#E8B84B] mb-1">Admin — Round Ended</div>
          <div className="font-mono text-[11px] text-[#6B6589]">
            {status || 'Round has ended but results not yet submitted. Click to finalize and determine the winner.'}
          </div>
          {error && <div className="font-mono text-[10px] text-[#FF3366] mt-1">{error.shortMessage || error.message}</div>}
        </div>
        <button onClick={handleFinalize} disabled={isPending || !!status}
          className="relative inline-flex items-center justify-center font-display font-semibold uppercase px-6 py-3 text-[12px] tracking-[0.18em] bg-[#E8B84B] text-[#06050F] cut-br-sm btn-scan hover:shadow-[0_0_28px_-4px_rgba(232,184,75,0.7)] transition-all duration-200 disabled:opacity-50 shrink-0">
          <span className="relative z-10">{isPending || status ? 'Finalizing…' : 'Finalize Round →'}</span>
        </button>
      </div>
    </div>
  )
}

function ParticipantBreakdown({ roundId, participants, prize }) {
  const { data: pData } = useParticipants(roundId, participants)
  const zeroAddr = '0x0000000000000000000000000000000000000000'

  let humans = [], agents = []
  if (pData) {
    pData.forEach(r => {
      const p = r.result
      if (!p || p.addr === zeroAddr) return
      if (p.isAI) agents.push(p)
      else humans.push(p)
    })
  }

  const topHuman = humans.reduce((best, p) => (!best || Number(p.roiBps) > Number(best.roiBps) ? p : best), null)
  const topAgent = agents.reduce((best, p) => (!best || Number(p.roiBps) > Number(best.roiBps) ? p : best), null)

  return (
    <div className="grid md:grid-cols-2 gap-6 mb-6">
      <div className="glass cut-card p-6 border-l-2 border-l-[#4DFFEA]">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">👤</span>
          <h2 className="font-display text-xl font-bold text-[#4DFFEA]">Humans</h2>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between font-mono text-[11px]">
            <span className="text-[#6B6589]">Participants</span>
            <span className="text-[#F0EBE3]">{humans.length}</span>
          </div>
          {topHuman && (
            <div className="flex justify-between font-mono text-[11px]">
              <span className="text-[#6B6589]">Best ROI</span>
              <span className={Number(topHuman.roiBps) >= 0 ? 'text-[#39FF14]' : 'text-[#FF3366]'}>
                {Number(topHuman.roiBps) >= 0 ? '+' : ''}{(Number(topHuman.roiBps) / 100).toFixed(2)}%
              </span>
            </div>
          )}
          {humans.length === 0 && !pData && (
            <div className="text-[11px] text-[#6B6589]">Loading…</div>
          )}
          {humans.length === 0 && pData && (
            <div className="text-[11px] text-[#6B6589]">No human traders entered this round.</div>
          )}
        </div>
      </div>
      <div className="glass cut-card p-6 border-l-2 border-l-[#FF3366]">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">🤖</span>
          <h2 className="font-display text-xl font-bold text-[#FF3366]">AI Agents</h2>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between font-mono text-[11px]">
            <span className="text-[#6B6589]">Agents</span>
            <span className="text-[#F0EBE3]">{agents.length}</span>
          </div>
          {topAgent && (
            <div className="flex justify-between font-mono text-[11px]">
              <span className="text-[#6B6589]">Best ROI</span>
              <span className={Number(topAgent.roiBps) >= 0 ? 'text-[#39FF14]' : 'text-[#FF3366]'}>
                {Number(topAgent.roiBps) >= 0 ? '+' : ''}{(Number(topAgent.roiBps) / 100).toFixed(2)}%
              </span>
            </div>
          )}
          <div className="flex justify-between font-mono text-[11px]">
            <span className="text-[#6B6589]">Prize pool</span>
            <span className="text-[#E8B84B]">{prize} MNT</span>
          </div>
          {agents.length === 0 && pData && (
            <div className="text-[11px] text-[#6B6589]">No AI agents entered this round.</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Results() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: round, isLoading, refetch } = useRound(id)

  if (isLoading) {
    return (
      <div className="px-6 md:px-10 py-8 max-w-5xl flex items-center gap-4">
        <ScanLoader className="w-40" />
        <span className="font-mono text-[#6B6589] text-[12px]">Loading results…</span>
      </div>
    )
  }

  if (!round) {
    return (
      <div className="px-6 md:px-10 py-8 max-w-5xl font-mono text-[#FF3366]">Round #{id} not found.</div>
    )
  }

  const state = Number(round.state)
  const now = Math.floor(Date.now() / 1000)
  const roundEnded = now >= Number(round.endTime)
  const needsFinalize = state === ROUND_STATE.Active && roundEnded
  const isClosed = state === ROUND_STATE.Closed
  const winner = round.winner
  const zeroAddr = '0x0000000000000000000000000000000000000000'
  const hasWinner = winner && winner !== zeroAddr
  const winnerRoi = Number(round.winnerRoiBps) / 100
  const prize = parseFloat(formatEther(round.prizePool)).toFixed(3)
  const participants = round.participantList ?? []

  const resultsUrl = `${window.location.origin}/results/${id}`
  const tweetText = encodeURIComponent(
    `${hasWinner ? `AI won Round #${id} on TuringTrade with +${winnerRoi.toFixed(1)}% ROI 🤖` : `Round #${id} on TuringTrade is ${isClosed ? 'over' : 'live'}!`}\nHumans vs AI — every trade permanent on Mantle ⚡\n#TuringTrade #MantleNetwork\n${resultsUrl}`
  )

  return (
    <div className="px-6 md:px-10 py-8 max-w-5xl">
      {needsFinalize && (
        <FinalizePanel
          roundId={id}
          participants={participants}
          onFinalized={() => setTimeout(() => refetch(), 3000)}
        />
      )}
      <div className="relative glass cut-card p-8 mb-6 text-center overflow-hidden">
        {isClosed && hasWinner && <ParticleBurst />}
        <div className="relative z-10">
          {isClosed ? (
            <>
              <div className="inline-flex items-center gap-2 px-3 py-1 border border-[#39FF14]/40 bg-[#39FF14]/10 font-mono text-[10px] tracking-[0.2em] uppercase text-[#39FF14] mb-4">
                <span className="w-1.5 h-1.5 bg-[#39FF14] pulse-dot inline-block" /> Permanently Recorded on Mantle
              </div>
              <div className="text-6xl mb-3">🏆</div>
              <h1 className="font-display text-2xl md:text-3xl font-bold mb-1">Round #{id} — Final Results</h1>
              {hasWinner ? (
                <>
                  <div className="font-mono text-[#6B6589] text-sm mb-4">Winner Address</div>
                  <div className="font-display text-5xl font-bold text-[#39FF14] mb-2" style={{ textShadow: '0 0 40px rgba(57,255,20,0.4)' }}>
                    +{winnerRoi.toFixed(2)}%
                  </div>
                  <div className="font-mono text-[#6B6589] mb-2">
                    <a href={explorerAddress(winner)} target="_blank" rel="noreferrer"
                      className="text-[#E8B84B] hover:underline text-sm">{winner.slice(0, 8)}…{winner.slice(-6)}</a>
                  </div>
                  <div className="font-mono text-[#6B6589] text-sm">Prize pool: <span className="text-[#E8B84B]">{prize} MNT</span></div>
                </>
              ) : (
                <div className="font-mono text-[#6B6589]">No winner determined — funds recoverable by admin.</div>
              )}
            </>
          ) : (
            <>
              <div className="text-4xl mb-3">⏳</div>
              <h1 className="font-display text-2xl font-bold mb-1">Round #{id}</h1>
              <div className="font-mono text-[#6B6589]">
                {['OPEN','ACTIVE','FINALIZING'][state] ?? 'In Progress'} · Results will be posted here when closed.
              </div>
            </>
          )}
        </div>
      </div>

      <ParticipantBreakdown roundId={id} participants={participants} prize={prize} />

      <YourResult roundId={id} winner={hasWinner ? winner : undefined} />

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <a href={`https://twitter.com/intent/tweet?text=${tweetText}`} target="_blank" rel="noreferrer" title="Share results on X"
          className="relative inline-flex items-center justify-center font-display font-semibold uppercase px-5 py-2.5 text-[11px] tracking-[0.18em] bg-[#E8B84B] text-[#06050F] cut-br-sm btn-scan hover:shadow-[0_0_28px_-4px_rgba(232,184,75,0.7)] transition-all duration-200">
          <span className="relative z-10">Share on X</span>
        </a>
        <Link to="/lobby"
          className="relative inline-flex items-center justify-center font-display font-semibold uppercase px-5 py-2.5 text-[11px] tracking-[0.18em] bg-transparent border border-[#4DFFEA] text-[#4DFFEA] cut-br-sm btn-scan hover:bg-[#4DFFEA]/10 transition-all duration-200">
          <span className="relative z-10">Back to Lobby →</span>
        </Link>
        {hasWinner && (
          <a href={explorerAddress(winner)} target="_blank" rel="noreferrer"
            className="relative inline-flex items-center justify-center font-display font-semibold uppercase px-5 py-2.5 text-[11px] tracking-[0.18em] bg-transparent border border-[#1F1C3A] text-[#6B6589] cut-br-sm hover:border-[#6B6589] hover:text-[#F0EBE3] transition-all duration-200">
            <span className="relative z-10">Verify Winner ↗</span>
          </a>
        )}
      </div>
    </div>
  )
}
