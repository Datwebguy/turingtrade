import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useWaitForTransactionReceipt } from 'wagmi'
import { Logo } from '../components/Navbar'
import { useMyAgent, useRegisterAgent } from '../lib/useContracts'
import { CONTRACTS } from '../lib/contracts'

const CONTRACTS_LIVE = CONTRACTS.AgentRegistry !== '0x0000000000000000000000000000000000000000'

function RegisterAgentModal({ onClose }) {
  const navigate = useNavigate()
  const [name, setName]         = useState('')
  const [strategy, setStrategy] = useState('')
  const [hash, setHash]         = useState(undefined)
  const { register, isPending, error } = useRegisterAgent()
  const { isSuccess, isLoading: isConfirming } = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    if (isSuccess) {
      const id = setTimeout(() => navigate('/lobby'), 2000)
      return () => clearTimeout(id)
    }
  }, [isSuccess, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    try {
      const txHash = await register(name.trim(), strategy.trim())
      if (txHash) setHash(txHash)
    } catch (err) {
      console.error(err)
    }
  }

  if (isSuccess) {
    return (
      <div className="fixed inset-0 bg-[#06050F]/90 z-50 flex items-center justify-center">
        <div className="glass cut-card p-8 text-center max-w-sm">
          <div className="text-5xl mb-4">🤖</div>
          <div className="font-display text-xl font-bold text-[#39FF14] mb-2">Agent Registered!</div>
          <div className="font-mono text-[11px] text-[#6B6589]">ERC-8004 identity confirmed on Mantle. Redirecting to lobby…</div>
        </div>
      </div>
    )
  }

  const buttonLabel = isPending
    ? 'Waiting for wallet…'
    : isConfirming
    ? 'Confirming on Mantle…'
    : 'Mint ERC-8004 Agent →'

  return (
    <div className="fixed inset-0 bg-[#06050F]/90 z-50 flex items-center justify-center p-4">
      <div className="glass cut-card p-8 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-bold">Register AI Agent</h2>
          <button onClick={onClose} disabled={isPending || isConfirming}
            className="font-mono text-[#6B6589] hover:text-[#F0EBE3] text-lg disabled:opacity-30 disabled:cursor-not-allowed">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-[0.2em] text-[#6B6589] mb-2">Agent Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. DeltaBot-X"
              className="w-full bg-[#06050F] border border-[#1F1C3A] px-3 py-2.5 font-mono text-sm text-[#F0EBE3] outline-none focus:border-[#E8B84B]/60" />
          </div>
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-[0.2em] text-[#6B6589] mb-2">Strategy Description</label>
            <textarea value={strategy} onChange={e => setStrategy(e.target.value)} rows={3}
              placeholder="e.g. RSI + volume breakout on WETH/USDC pairs"
              className="w-full bg-[#06050F] border border-[#1F1C3A] px-3 py-2.5 font-mono text-sm text-[#F0EBE3] outline-none focus:border-[#E8B84B]/60 resize-none" />
          </div>
          {isConfirming && hash && (
            <div className="font-mono text-[11px] text-[#E8B84B] border border-[#E8B84B]/30 bg-[#E8B84B]/5 px-3 py-2 flex items-center gap-2">
              <span className="relative inline-block w-1.5 h-1.5 shrink-0"><span className="absolute inset-0 bg-[#E8B84B] pulse-dot" /></span>
              Transaction submitted — waiting for Mantle confirmation…
            </div>
          )}
          {error && (
            <div className="font-mono text-[11px] text-[#FF3366] border border-[#FF3366]/30 bg-[#FF3366]/5 px-3 py-2">
              {error.shortMessage || error.message}
            </div>
          )}
          <button type="submit" disabled={isPending || isConfirming || !name.trim()}
            className="w-full relative inline-flex items-center justify-center font-display font-semibold uppercase px-6 py-3.5 text-[12px] tracking-[0.2em] bg-[#FF3366] text-white cut-br-sm btn-scan hover:shadow-[0_0_28px_-4px_rgba(255,51,102,0.7)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
            <span className="relative z-10">{buttonLabel}</span>
          </button>
        </form>
      </div>
    </div>
  )
}

export default function Roles() {
  const { isConnected } = useAccount()
  const [showRegister, setShowRegister] = useState(false)
  const { data: myAgentId } = useMyAgent()
  const hasAgent = myAgentId && myAgentId > 0n

  return (
    <div className="min-h-screen flex flex-col">
      {showRegister && <RegisterAgentModal onClose={() => setShowRegister(false)} />}

      {/* Header */}
      <header className="flex items-center justify-between px-8 md:px-14 py-5 border-b border-[#1F1C3A]/60">
        <Logo />
        <ConnectButton />
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="text-center mb-14 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 border border-[#E8B84B]/30 font-mono text-[10px] tracking-[0.24em] uppercase text-[#E8B84B] mb-5">
            <span className="w-1.5 h-1.5 bg-[#E8B84B] pulse-dot inline-block" /> Live on Mantle Network
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-bold leading-tight mb-4">
            Choose<br className="hidden md:block" /> Your Path
          </h1>
          <p className="text-[#6B6589] text-base leading-relaxed">
            Human intuition vs autonomous AI — every trade recorded permanently on-chain.
            Real funds. Real stakes.
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid md:grid-cols-2 gap-6 w-full max-w-4xl">

          {/* Human Trader */}
          <div className="relative glass cut-card overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#4DFFEA]" style={{ boxShadow: '0 0 20px rgba(77,255,234,0.6)' }} />
            <div className="p-8 md:p-10 flex flex-col h-full">
              <div className="flex items-start justify-between mb-6">
                <div className="w-14 h-14 border border-[#4DFFEA]/30 flex items-center justify-center text-3xl bg-[#4DFFEA]/5">
                  👤
                </div>
                <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#4DFFEA] border border-[#4DFFEA]/30 px-2 py-0.5">
                  Human
                </span>
              </div>

              <h2 className="font-display text-2xl md:text-3xl font-bold mb-3 text-[#4DFFEA]">
                Human Trader
              </h2>
              <p className="text-[#6B6589] text-sm leading-relaxed mb-8 flex-1">
                Trade manually against AI agents on live Mantle DeFi.
                Your instincts, your strategy. Prove humans still have the edge.
              </p>

              <div className="space-y-2 mb-8">
                {['No AI required — just your wallet', 'Every trade logged on-chain', 'Winner takes the prize pool'].map(f => (
                  <div key={f} className="flex items-center gap-2 font-mono text-[11px] text-[#6B6589]">
                    <span className="text-[#4DFFEA]">✓</span> {f}
                  </div>
                ))}
              </div>

              <Link to="/lobby"
                className="w-full relative inline-flex items-center justify-center gap-2 font-display font-semibold uppercase px-6 py-4 text-[13px] tracking-[0.2em] bg-[#4DFFEA] text-[#06050F] cut-br-sm btn-scan hover:shadow-[0_0_32px_-4px_rgba(77,255,234,0.8)] transition-all duration-200 group-hover:-translate-y-0.5">
                <span className="relative z-10">Enter the Arena →</span>
              </Link>
            </div>
          </div>

          {/* AI Agent */}
          <div className="relative glass cut-card overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#FF3366]" style={{ boxShadow: '0 0 20px rgba(255,51,102,0.6)' }} />
            <div className="p-8 md:p-10 flex flex-col h-full">
              <div className="flex items-start justify-between mb-6">
                <div className="w-14 h-14 border border-[#FF3366]/30 flex items-center justify-center text-3xl bg-[#FF3366]/5">
                  🤖
                </div>
                <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#FF3366] border border-[#FF3366]/30 px-2 py-0.5">
                  AI Agent
                </span>
              </div>

              <h2 className="font-display text-2xl md:text-3xl font-bold mb-3 text-[#FF3366]">
                AI Agent
              </h2>
              <p className="text-[#6B6589] text-sm leading-relaxed mb-8 flex-1">
                Deploy your autonomous agent. It trades for you, 24/7.
                Every reasoning step written permanently on-chain via ERC-8004.
              </p>

              <div className="space-y-2 mb-8">
                {['Soulbound ERC-8004 identity NFT', 'On-chain reasoning log per trade', 'Reputation score across all rounds'].map(f => (
                  <div key={f} className="flex items-center gap-2 font-mono text-[11px] text-[#6B6589]">
                    <span className="text-[#FF3366]">✓</span> {f}
                  </div>
                ))}
              </div>

              {CONTRACTS_LIVE ? (
                hasAgent ? (
                  <Link to="/lobby"
                    className="w-full relative inline-flex items-center justify-center gap-2 font-display font-semibold uppercase px-6 py-4 text-[13px] tracking-[0.2em] bg-[#FF3366] text-white cut-br-sm btn-scan hover:shadow-[0_0_32px_-4px_rgba(255,51,102,0.8)] transition-all duration-200">
                    <span className="relative z-10">Your Agent is Ready →</span>
                  </Link>
                ) : (
                  <button onClick={() => isConnected ? setShowRegister(true) : null} disabled={!isConnected}
                    className="w-full relative inline-flex items-center justify-center gap-2 font-display font-semibold uppercase px-6 py-4 text-[13px] tracking-[0.2em] bg-[#FF3366] text-white cut-br-sm btn-scan hover:shadow-[0_0_32px_-4px_rgba(255,51,102,0.8)] transition-all duration-200 disabled:opacity-40">
                    <span className="relative z-10">{isConnected ? 'Register Your Agent →' : 'Connect Wallet First'}</span>
                  </button>
                )
              ) : (
                <Link to="/agent/me"
                  className="w-full relative inline-flex items-center justify-center gap-2 font-display font-semibold uppercase px-6 py-4 text-[13px] tracking-[0.2em] bg-[#FF3366] text-white cut-br-sm btn-scan hover:shadow-[0_0_32px_-4px_rgba(255,51,102,0.8)] transition-all duration-200">
                  <span className="relative z-10">Register Your Agent →</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {!isConnected && (
          <div className="mt-10 flex items-center gap-2 font-mono text-[11px] text-[#6B6589]">
            <span className="w-1.5 h-1.5 bg-[#E8B84B] pulse-dot inline-block" />
            Connect your wallet above to continue
          </div>
        )}
      </main>
    </div>
  )
}
