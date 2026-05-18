import { useState, useEffect, useCallback } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useAccount, useWaitForTransactionReceipt, usePublicClient } from 'wagmi'
import { formatEther, parseAbiItem } from 'viem'
import { FlipCountdown, SectionTitle, ScanLoader } from '../components/ui'
import {
  useRound, useParticipant, useParticipants, useSubmitTrade, useEnterRound,
  useMyAgent, useTradeEvents, useRoundFinalizedEvent, ROUND_STATE, CHAIN,
} from '../lib/useContracts'
// useTradeEvents is used inside useRoundTrades hook below
import { explorerTx, CONTRACTS } from '../lib/contracts'

// Must match agent-bot.js and keeper.js
const PAIRS = ['MNT/USDT', 'ETH/USDT', 'BTC/USDT', 'ARB/USDT', 'OP/USDT']

function Leaderboard({ roundId, addresses, userAddress }) {
  const { data: results } = useParticipants(roundId, addresses)
  const rows = (addresses ?? []).map((addr, i) => ({
    addr,
    p: results?.[i]?.result,
  })).sort((a, b) => Number((b.p?.roiBps ?? 0n) - (a.p?.roiBps ?? 0n)))

  if (!addresses?.length) {
    return <div className="p-4 font-mono text-[11px] text-[#6B6589]">No participants yet</div>
  }

  return rows.map(({ addr, p }, i) => {
    const roi = p ? Number(p.roiBps) / 100 : 0
    const isYou = addr?.toLowerCase() === userAddress?.toLowerCase()
    return (
      <div key={addr} className={`flex items-center gap-3 px-4 py-2.5 border-b border-[#1F1C3A]/40 hover:bg-[#E8B84B]/5 transition-colors ${isYou ? 'border-l-2 border-l-[#E8B84B]' : ''}`}>
        <span className="font-mono text-[11px] w-5 text-[#6B6589]">{i + 1}</span>
        <span className="text-sm">{p?.isAI ? '🤖' : '👤'}</span>
        <div className="flex-1 min-w-0">
          <div className={`font-mono text-[11px] truncate ${isYou ? 'text-[#E8B84B]' : 'text-[#F0EBE3]/80'}`}>
            {isYou ? 'You' : addr.slice(0, 6) + '…' + addr.slice(-4)}
          </div>
        </div>
        <div className={`font-mono text-[12px] shrink-0 ${roi >= 0 ? 'text-[#39FF14]' : 'text-[#FF3366]'}`}>
          {roi >= 0 ? '+' : ''}{roi.toFixed(1)}%
        </div>
      </div>
    )
  })
}

function TradeLog({ myTrades }) {
  if (!myTrades.length) return null
  return (
    <div className="border border-[#1F1C3A] divide-y divide-[#1F1C3A]/60 max-h-[140px] overflow-y-auto no-scrollbar">
      {myTrades.map((t, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-1.5">
          <span className={`font-mono text-[10px] font-bold w-8 ${t.isBuy ? 'text-[#39FF14]' : 'text-[#FF3366]'}`}>
            {t.isBuy ? 'BUY' : 'SELL'}
          </span>
          <span className="font-mono text-[10px] text-[#F0EBE3]/70 flex-1">{t.pair}</span>
          <span className="font-mono text-[10px] text-[#6B6589]">{(Number(t.amountBps) / 100).toFixed(0)}%</span>
          <a href={explorerTx(t.tx)} target="_blank" rel="noopener noreferrer"
            className="font-mono text-[9px] text-[#E8B84B] hover:underline shrink-0">{t.tx?.slice(0,6)}… ↗</a>
        </div>
      ))}
    </div>
  )
}

function TradePanel({ roundId, myPosition, myTrades, state }) {
  const [pair, setPair]           = useState(PAIRS[0])
  const [pct, setPct]             = useState('10')
  const [reasoning, setReasoning] = useState('')
  const { submit, isPending, error, txHash } = useSubmitTrade()
  const { isSuccess } = useWaitForTransactionReceipt({ hash: txHash })

  const handleTrade = async (isBuy) => {
    const amountBps = BigInt(Math.max(1, Math.round(parseFloat(pct || '0') * 100)))
    const log = reasoning.trim() || `${isBuy ? 'BUY' : 'SELL'} ${pair} — ${pct}% allocation`
    await submit(roundId, pair, amountBps, isBuy, log)
    // errors propagate to the `error` state from useSubmitTrade and are rendered below
  }

  const tradeCount  = myPosition ? Number(myPosition.tradeCount) : 0
  const roiBps      = myPosition ? Number(myPosition.roiBps) : 0
  // Show final P&L only after the round is closed — not based on whether roiBps is 0
  // (a participant can legitimately finish with exactly 0%)
  const hasFinalRoi = state === ROUND_STATE.Closed && !!myPosition?.addr

  return (
    <div className="p-4 space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="glass cut-br-sm p-3">
          <div className="text-[10px] tracking-[0.2em] uppercase text-[#6B6589]">Signals Sent</div>
          <div className="font-mono text-lg mt-1">{tradeCount}</div>
        </div>
        <div className="glass cut-br-sm p-3">
          <div className="text-[10px] tracking-[0.2em] uppercase text-[#6B6589]">Final P&L</div>
          {hasFinalRoi ? (
            <div className={`font-mono text-lg mt-1 ${roiBps >= 0 ? 'text-[#39FF14]' : 'text-[#FF3366]'}`}>
              {roiBps >= 0 ? '+' : ''}{(roiBps / 100).toFixed(2)}%
            </div>
          ) : (
            <div className="font-mono text-base mt-1 text-[#6B6589]">
              — <span className="text-[9px] tracking-[0.15em] uppercase">at close</span>
            </div>
          )}
        </div>
      </div>

      {myTrades.length > 0 && (
        <div>
          <div className="text-[9px] uppercase tracking-[0.2em] text-[#6B6589] mb-1">Your Trade Signals (on-chain)</div>
          <TradeLog myTrades={myTrades} />
        </div>
      )}

      <div className="border-t border-[#1F1C3A]/60 pt-3">
        <select value={pair} onChange={e => setPair(e.target.value)}
          className="w-full bg-[#06050F] border border-[#1F1C3A] px-3 py-2 font-mono text-sm text-[#F0EBE3] outline-none focus:border-[#E8B84B]/60 mb-2">
          {PAIRS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>

        <div className="flex gap-1 border border-[#1F1C3A] mb-2">
          <span className="px-3 flex items-center font-mono text-[#6B6589] text-xs border-r border-[#1F1C3A] bg-[#06050F]">%</span>
          <input type="number" min="1" max="100" value={pct} onChange={e => setPct(e.target.value)}
            className="flex-1 bg-transparent px-3 py-2 font-mono text-sm outline-none text-[#F0EBE3]" />
        </div>

        <textarea value={reasoning} onChange={e => setReasoning(e.target.value)} rows={2}
          placeholder="On-chain reasoning (optional — logged via ERC-8004)..."
          className="w-full bg-[#06050F] border border-[#1F1C3A] px-3 py-2 font-mono text-[11px] text-[#F0EBE3] outline-none focus:border-[#E8B84B]/60 resize-none mb-2" />

        {error && (
          <div className="font-mono text-[10px] text-[#FF3366] border border-[#FF3366]/30 bg-[#FF3366]/5 px-2 py-1.5 break-all mb-2">
            {error.shortMessage || error.message}
          </div>
        )}
        {isSuccess && (
          <div className="font-mono text-[10px] text-[#39FF14] border border-[#39FF14]/30 bg-[#39FF14]/5 px-2 py-1.5 mb-2">
            Signal logged on-chain ✓ — P&L computed at round close
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => handleTrade(true)} disabled={isPending}
            className="relative inline-flex items-center justify-center font-display font-semibold uppercase px-4 py-3 text-[12px] tracking-[0.18em] bg-[#39FF14] text-[#06050F] cut-br-sm btn-scan hover:shadow-[0_0_28px_-4px_rgba(57,255,20,0.7)] transition-all duration-200 disabled:opacity-50">
            <span className="relative z-10">{isPending ? '…' : 'BUY'}</span>
          </button>
          <button onClick={() => handleTrade(false)} disabled={isPending}
            className="relative inline-flex items-center justify-center font-display font-semibold uppercase px-4 py-3 text-[12px] tracking-[0.18em] bg-[#FF3366] text-white cut-br-sm btn-scan hover:shadow-[0_0_28px_-4px_rgba(255,51,102,0.7)] transition-all duration-200 disabled:opacity-50">
            <span className="relative z-10">{isPending ? '…' : 'SELL'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

const TRADE_SUBMITTED_EVENT = parseAbiItem(
  'event TradeSubmitted(uint256 indexed roundId, address indexed trader, string pair, int256 amountBps, bool isBuy, uint256 logEntryId)'
)

function logToItem(log) {
  const trader = log.args.trader ?? ''
  return {
    id: log.transactionHash ?? `${log.blockHash}-${log.logIndex}`,
    trader,
    who: trader.slice(0, 6) + '…' + trader.slice(-4),
    pair: log.args.pair ?? '',
    isBuy: log.args.isBuy ?? true,
    amountBps: log.args.amountBps ?? 0n,
    action: `${log.args.isBuy ? 'BUY' : 'SELL'} ${log.args.pair ?? ''}`,
    tx: log.transactionHash,
    txShort: (log.transactionHash ?? '').slice(0, 8) + '…',
  }
}

function useRoundTrades(roundId, address) {
  const [items, setItems]   = useState([])
  const [loaded, setLoaded] = useState(false)
  const publicClient        = usePublicClient({ chainId: CHAIN.id })

  // One-time historical fetch on mount (or when roundId changes)
  useEffect(() => {
    if (roundId == null || !publicClient) return
    let cancelled = false
    ;(async () => {
      try {
        const latest    = await publicClient.getBlockNumber()
        const fromBlock = latest > 100_000n ? latest - 100_000n : 0n
        const logs      = await publicClient.getLogs({
          address:   CONTRACTS.TuringRound,
          event:     TRADE_SUBMITTED_EVENT,
          args:      { roundId: BigInt(roundId) },
          fromBlock,
          toBlock:   'latest',
        })
        if (!cancelled) setItems([...logs].reverse().map(logToItem))
      } catch (err) {
        console.error('getLogs failed:', err)
      } finally {
        if (!cancelled) setLoaded(true)
      }
    })()
    return () => { cancelled = true }
  }, [roundId, publicClient])

  // Live subscription for new events — no polling
  useTradeEvents(roundId, (log) => {
    setItems(prev => {
      const item = logToItem(log)
      if (prev.some(t => t.id === item.id)) return prev   // deduplicate
      return [item, ...prev]
    })
  })

  const myTrades = address ? items.filter(t => t.trader?.toLowerCase() === address.toLowerCase()) : []
  return { items: items.slice(0, 20), myTrades, loaded }
}

function LiveFeed({ items, loaded }) {

  if (!items.length && !loaded) {
    return (
      <div className="p-6 text-center">
        <div className="font-mono text-[10px] text-[#6B6589]">Loading on-chain activity…</div>
        <ScanLoader className="mt-3" />
      </div>
    )
  }

  if (!items.length && loaded) {
    return (
      <div className="p-6 text-center">
        <div className="font-mono text-[10px] text-[#6B6589]">No signals yet — be the first.</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col overflow-y-auto no-scrollbar" style={{ maxHeight: 'calc(100vh - 130px)' }}>
      {items.map((ev, i) => (
        <div key={ev.id} className={`feed-punch border-b border-[#1F1C3A]/60 px-4 py-3 ${i === 0 ? 'border-l-2 border-l-[#E8B84B]' : ''}`}>
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-6 h-6 flex items-center justify-center border text-xs shrink-0 ${ev.isBuy ? 'border-[#39FF14]/40 text-[#39FF14]' : 'border-[#FF3366]/40 text-[#FF3366]'}`}>
              {ev.isBuy ? '▲' : '▼'}
            </div>
            <span className="font-mono text-[11px] font-bold truncate">{ev.who}</span>
          </div>
          <div className="font-mono text-[11px] text-[#F0EBE3]/80 pl-8">{ev.action} · {(Number(ev.amountBps) / 100).toFixed(0)}%</div>
          <a href={explorerTx(ev.tx)} target="_blank" rel="noopener noreferrer"
            className="font-mono text-[10px] text-[#E8B84B] hover:underline pl-8 block mt-0.5">{ev.txShort} ↗</a>
        </div>
      ))}
    </div>
  )
}

function EnterPanel({ id, feeEth, enter, isEntering, enteredOk, hasAgent, enterError }) {
  const [stake, setStake] = useState(feeEth)
  const minFee = parseFloat(feeEth)
  const stakeVal = parseFloat(stake) || 0
  const valid = stakeVal >= minFee

  return (
    <div className="p-4 space-y-3">
      <div className="font-mono text-[12px] text-[#6B6589]">
        Min entry: <span className="text-[#E8B84B]">{minFee.toFixed(3)} MNT</span>
        <span className="text-[#6B6589]/50 ml-2">— stake more to grow the prize pool</span>
      </div>
      <div className="flex gap-1 border border-[#1F1C3A]">
        <span className="px-3 flex items-center font-mono text-[#6B6589] text-xs border-r border-[#1F1C3A] bg-[#06050F]">MNT</span>
        <input
          type="number" min={minFee} step="0.01" value={stake}
          onChange={e => setStake(e.target.value)}
          className="flex-1 bg-transparent px-3 py-2 font-mono text-sm outline-none text-[#F0EBE3]"
        />
      </div>
      {!valid && stakeVal > 0 && (
        <div className="font-mono text-[10px] text-[#FF3366]">Minimum is {minFee.toFixed(3)} MNT</div>
      )}
      {enterError && (
        <div className="font-mono text-[10px] text-[#FF3366] border border-[#FF3366]/30 bg-[#FF3366]/5 px-2 py-1.5 break-all">
          {enterError.shortMessage || enterError.message}
        </div>
      )}
      {enteredOk && <div className="font-mono text-[11px] text-[#39FF14]">Entered! Ready to trade.</div>}
      <div className={`grid gap-2 ${hasAgent ? 'grid-cols-2' : 'grid-cols-1'}`}>
        <button onClick={() => enter(id, stake, false)} disabled={isEntering || !valid}
          className="relative inline-flex items-center justify-center font-display font-semibold uppercase px-5 py-3 text-[12px] tracking-[0.18em] bg-[#4DFFEA] text-[#06050F] cut-br-sm btn-scan hover:shadow-[0_0_28px_-4px_rgba(77,255,234,0.7)] transition-all duration-200 disabled:opacity-50">
          <span className="relative z-10">{isEntering ? 'Entering…' : '👤 Human →'}</span>
        </button>
        {hasAgent && (
          <button onClick={() => enter(id, stake, true)} disabled={isEntering || !valid}
            className="relative inline-flex items-center justify-center font-display font-semibold uppercase px-5 py-3 text-[12px] tracking-[0.18em] bg-[#FF3366] text-white cut-br-sm btn-scan hover:shadow-[0_0_28px_-4px_rgba(255,51,102,0.7)] transition-all duration-200 disabled:opacity-50">
            <span className="relative z-10">{isEntering ? 'Entering…' : '🤖 AI Agent →'}</span>
          </button>
        )}
      </div>
      {hasAgent && (
        <div className="font-mono text-[10px] text-[#FF3366]/70 text-center">
          You have a registered ERC-8004 agent — enter as AI to compete on its record
        </div>
      )}
    </div>
  )
}

export default function Arena() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { address, isConnected } = useAccount()
  const { data: round, isLoading } = useRound(id)
  const { data: myPosition } = useParticipant(id, address)
  const { data: myAgentId } = useMyAgent()
  const hasAgent = myAgentId != null && myAgentId > 0n
  const { enter, isPending: isEntering, txHash: enterTx, error: enterError } = useEnterRound()
  const { isSuccess: enteredOk } = useWaitForTransactionReceipt({ hash: enterTx })
  useRoundFinalizedEvent(id, () => navigate(`/results/${id}`))
  const { items: feedItems, myTrades, loaded: feedLoaded } = useRoundTrades(id, address)

  const state = round ? Number(round.state) : null
  const isLive = state === ROUND_STATE.Active
  const participants = round?.participantList ?? []
  const prizeEth = round ? formatEther(round.prizePool) : '0'
  const feeEth   = round ? formatEther(round.entryFee)  : '0.01'
  const endsAt   = round ? Number(round.endTime) * 1000 : Date.now() + 86400000
  const roundEnded = isLive && Date.now() >= endsAt
  const zeroAddr = '0x0000000000000000000000000000000000000000'
  const isInRound = myPosition && myPosition.addr !== zeroAddr

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-56px)] md:h-screen flex items-center justify-center gap-4">
        <ScanLoader className="w-40" />
        <span className="font-mono text-[#6B6589] text-[12px]">Loading round…</span>
      </div>
    )
  }

  if (!round) {
    return (
      <div className="h-[calc(100vh-56px)] md:h-screen flex items-center justify-center font-mono text-[#FF3366]">Round #{id} not found</div>
    )
  }

  return (
    <div className="h-[calc(100vh-56px)] md:h-screen flex flex-col">
      <div className="flex flex-wrap items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-[#1F1C3A] shrink-0 gap-2">
        <div className="flex items-center gap-3">
          <span className="font-display text-base md:text-lg font-bold">Round <span className="text-[#6B6589]">#</span>{id}</span>
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono tracking-[0.18em] uppercase border ${isLive ? 'bg-[#FF3366] text-white border-[#FF3366]' : 'text-[#E8B84B] border-[#E8B84B]'}`}>
            {isLive && <span className="relative inline-block w-1.5 h-1.5"><span className="absolute inset-0 bg-white pulse-dot" /></span>}
            {['OPEN','ACTIVE','FINALIZING','CLOSED'][state ?? 0]}
          </span>
        </div>
        <div className="flex items-center gap-3 md:gap-5 font-mono text-[11px] text-[#6B6589] flex-wrap">
          <span>Ends <span className="text-[#F0EBE3]"><FlipCountdown endsAt={endsAt} /></span></span>
          <span className="hidden sm:inline">Prize <span className="text-[#E8B84B]">{parseFloat(prizeEth).toFixed(3)} MNT</span></span>
          <span><span className="text-[#F0EBE3]">{participants.length}</span> traders</span>
          {state === ROUND_STATE.Closed && (
            <Link to={`/results/${id}`}
              className="font-mono text-[10px] tracking-[0.18em] uppercase text-[#E8B84B] border border-[#E8B84B]/40 px-2 py-1 hover:bg-[#E8B84B]/10">
              Results →
            </Link>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-auto md:overflow-hidden">
        {/* Leaderboard */}
        <div className="md:w-[260px] md:shrink-0 border-b md:border-b-0 md:border-r border-[#1F1C3A] flex flex-col">
          <div className="px-4 py-3 border-b border-[#1F1C3A]">
            <SectionTitle live={isLive}>Rankings</SectionTitle>
          </div>
          <div className="md:flex-1 overflow-y-auto no-scrollbar">
            <Leaderboard roundId={id} addresses={participants} userAddress={address} />
          </div>
        </div>

        {/* Trade Panel */}
        <div className="md:flex-1 flex flex-col border-b md:border-b-0 md:border-r border-[#1F1C3A] overflow-y-auto no-scrollbar">
          <div className="p-4 border-b border-[#1F1C3A]">
            <SectionTitle>{isInRound ? 'Your Position' : 'Enter Round'}</SectionTitle>
          </div>
          {!isConnected ? (
            <div className="p-6 font-mono text-[11px] text-[#6B6589] text-center">Connect wallet to trade</div>
          ) : roundEnded ? (
            <div className="p-5 space-y-3">
              <div className="font-mono text-[11px] text-[#E8B84B] border border-[#E8B84B]/30 bg-[#E8B84B]/5 px-3 py-2 flex items-center gap-2">
                <span className="relative inline-block w-1.5 h-1.5 shrink-0"><span className="absolute inset-0 bg-[#E8B84B] pulse-dot" /></span>
                Round has ended — keeper is calculating results…
              </div>
              <div className="font-mono text-[10px] text-[#6B6589]">
                Results will be finalized on-chain within ~60 seconds. Check the{' '}
                <Link to={`/results/${id}`} className="text-[#E8B84B] hover:underline">Results page</Link>.
              </div>
            </div>
          ) : !isInRound ? (
            <EnterPanel id={id} feeEth={feeEth} enter={enter} isEntering={isEntering} enteredOk={enteredOk} hasAgent={hasAgent} enterError={enterError} />
          ) : isInRound && !isLive ? (
            <div className="p-5 font-mono text-[11px] text-[#6B6589] space-y-2">
              <div>You're entered. Trades open when the round activates.</div>
              <div className="text-[10px] text-[#6B6589]/60 uppercase tracking-[0.15em]">
                State: {['OPEN','ACTIVE','FINALIZING','CLOSED'][state ?? 0]}
              </div>
            </div>
          ) : (
            <TradePanel roundId={id} myPosition={myPosition} myTrades={myTrades} state={state} />
          )}
        </div>

        {/* Live Feed */}
        <div className="md:w-[300px] md:shrink-0 flex flex-col">
          <div className="px-4 py-3 border-b border-[#1F1C3A]">
            <SectionTitle live={isLive}>On-Chain Activity</SectionTitle>
          </div>
          <LiveFeed items={feedItems} loaded={feedLoaded} />
        </div>
      </div>
    </div>
  )
}
