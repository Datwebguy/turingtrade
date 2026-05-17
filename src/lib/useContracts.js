import { useReadContract, useReadContracts, useWriteContract, useWatchContractEvent, useAccount, useSwitchChain, useChainId } from 'wagmi'
import { parseEther } from 'viem'
import { CONTRACTS, TURING_ROUND_ABI, AGENT_REGISTRY_ABI, REASONING_LOG_ABI, IS_TESTNET } from './contracts'
import { mantleTestnet, mantle } from './wagmi'

export const CHAIN = IS_TESTNET ? mantleTestnet : mantle

// ── Chain guard — call before any write ───────────────────────────────────

export function useChainGuard() {
  const chainId = useChainId()
  const { switchChainAsync } = useSwitchChain()

  const ensureChain = async () => {
    if (chainId !== CHAIN.id) {
      await switchChainAsync({ chainId: CHAIN.id })
    }
  }
  return { ensureChain, isWrongChain: chainId !== CHAIN.id }
}

// ── Round reads ────────────────────────────────────────────────────────────

export function useRoundCount() {
  return useReadContract({
    address: CONTRACTS.TuringRound,
    abi: TURING_ROUND_ABI,
    functionName: 'roundCount',
    chainId: CHAIN.id,
    query: { refetchInterval: 10_000 },
  })
}

export function useRound(roundId) {
  const id = roundId != null && Number.isInteger(Number(roundId)) ? BigInt(roundId) : null
  return useReadContract({
    address: CONTRACTS.TuringRound,
    abi: TURING_ROUND_ABI,
    functionName: 'getRound',
    args: [id ?? 0n],
    chainId: CHAIN.id,
    query: { enabled: id != null, refetchInterval: 8_000 },
  })
}

export function useParticipant(roundId, address) {
  const id = roundId != null && Number.isInteger(Number(roundId)) ? BigInt(roundId) : null
  return useReadContract({
    address: CONTRACTS.TuringRound,
    abi: TURING_ROUND_ABI,
    functionName: 'getParticipant',
    args: [id ?? 0n, address],
    chainId: CHAIN.id,
    query: { enabled: id != null && !!address, refetchInterval: 10_000 },
  })
}

export function useParticipants(roundId, addresses) {
  const id = roundId != null && Number.isInteger(Number(roundId)) ? BigInt(roundId) : null
  return useReadContracts({
    contracts: (addresses ?? []).map(addr => ({
      address: CONTRACTS.TuringRound,
      abi: TURING_ROUND_ABI,
      functionName: 'getParticipant',
      args: [id ?? 0n, addr],
      chainId: CHAIN.id,
    })),
    query: { enabled: id != null && (addresses?.length ?? 0) > 0, refetchInterval: 10_000 },
  })
}

// ── Round writes ───────────────────────────────────────────────────────────

export function useEnterRound() {
  const { data: txHash, writeContractAsync, isPending, error } = useWriteContract()
  const { ensureChain } = useChainGuard()

  const enter = async (roundId, entryFeeMnt, isAI = false) => {
    await ensureChain()
    return writeContractAsync({
      address: CONTRACTS.TuringRound,
      abi: TURING_ROUND_ABI,
      functionName: 'enter',
      args: [BigInt(roundId), isAI],
      value: parseEther(String(entryFeeMnt)),
      chainId: CHAIN.id,
    })
  }

  return { enter, txHash, isPending, error }
}

export function useSubmitTrade() {
  const { data: txHash, writeContractAsync, isPending, error } = useWriteContract()
  const { ensureChain } = useChainGuard()

  const submit = async (roundId, pair, amountBps, isBuy, reasoning) => {
    await ensureChain()
    return writeContractAsync({
      address: CONTRACTS.TuringRound,
      abi: TURING_ROUND_ABI,
      functionName: 'submitTrade',
      args: [BigInt(roundId), pair, BigInt(amountBps), isBuy, reasoning],
      chainId: CHAIN.id,
    })
  }

  return { submit, txHash, isPending, error }
}

export function useContractOwner() {
  return useReadContract({
    address: CONTRACTS.TuringRound,
    abi: TURING_ROUND_ABI,
    functionName: 'owner',
    chainId: CHAIN.id,
  })
}

export function useSubmitResults() {
  const { data: txHash, writeContractAsync, isPending, error } = useWriteContract()
  const { ensureChain } = useChainGuard()

  const submitResults = async (roundId, addrs, roiBpsArr, liquidatedArr) => {
    await ensureChain()
    return writeContractAsync({
      address: CONTRACTS.TuringRound,
      abi: TURING_ROUND_ABI,
      functionName: 'submitResults',
      args: [BigInt(roundId), addrs, roiBpsArr.map(BigInt), liquidatedArr],
      chainId: CHAIN.id,
    })
  }

  return { submitResults, txHash, isPending, error }
}

export function useClaimPrize() {
  const { data: txHash, writeContractAsync, isPending, error } = useWriteContract()
  const { ensureChain } = useChainGuard()

  const claim = async (roundId) => {
    await ensureChain()
    return writeContractAsync({
      address: CONTRACTS.TuringRound,
      abi: TURING_ROUND_ABI,
      functionName: 'claimPrize',
      args: [BigInt(roundId)],
      chainId: CHAIN.id,
    })
  }

  return { claim, txHash, isPending, error }
}

// ── Agent reads ────────────────────────────────────────────────────────────

export function useMyAgent() {
  const { address } = useAccount()
  return useReadContract({
    address: CONTRACTS.AgentRegistry,
    abi: AGENT_REGISTRY_ABI,
    functionName: 'ownerToAgent',
    args: [address],
    chainId: CHAIN.id,
    query: { enabled: !!address },
  })
}

export function useAgent(tokenId) {
  const id = Number.isInteger(Number(tokenId)) && Number(tokenId) > 0 ? BigInt(tokenId) : null
  return useReadContract({
    address: CONTRACTS.AgentRegistry,
    abi: AGENT_REGISTRY_ABI,
    functionName: 'getAgent',
    args: [id ?? 0n],
    chainId: CHAIN.id,
    query: { enabled: id != null },
  })
}

export function useAgentReputation(tokenId) {
  const id = Number.isInteger(Number(tokenId)) && Number(tokenId) > 0 ? BigInt(tokenId) : null
  return useReadContract({
    address: CONTRACTS.AgentRegistry,
    abi: AGENT_REGISTRY_ABI,
    functionName: 'reputationScore',
    args: [id ?? 0n],
    chainId: CHAIN.id,
    query: { enabled: id != null, refetchInterval: 30_000 },
  })
}

export function useRegisterAgent() {
  const { data: txHash, writeContractAsync, isPending, error } = useWriteContract()
  const { ensureChain } = useChainGuard()

  const register = async (name, strategyDescription) => {
    await ensureChain()
    return writeContractAsync({
      address: CONTRACTS.AgentRegistry,
      abi: AGENT_REGISTRY_ABI,
      functionName: 'registerAgent',
      args: [name, strategyDescription],
      chainId: CHAIN.id,
    })
  }

  return { register, txHash, isPending, error }
}

// ── Reasoning log reads ────────────────────────────────────────────────────

export function useReasoningEntry(entryId) {
  const id = entryId != null && Number.isInteger(Number(entryId)) ? BigInt(entryId) : null
  return useReadContract({
    address: CONTRACTS.ReasoningLog,
    abi: REASONING_LOG_ABI,
    functionName: 'getEntry',
    args: [id ?? 0n],
    chainId: CHAIN.id,
    query: { enabled: id != null },
  })
}

export function useAgentRoundLogs(agentAddress, roundId) {
  const id = roundId != null && Number.isInteger(Number(roundId)) ? BigInt(roundId) : null
  return useReadContract({
    address: CONTRACTS.ReasoningLog,
    abi: REASONING_LOG_ABI,
    functionName: 'getAgentRoundEntries',
    args: [agentAddress, id ?? 0n],
    chainId: CHAIN.id,
    query: { enabled: !!agentAddress && id != null, refetchInterval: 12_000 },
  })
}

// ── Live event watchers ────────────────────────────────────────────────────

export function useTradeEvents(roundId, onTrade) {
  const id = roundId != null && Number.isInteger(Number(roundId)) ? BigInt(roundId) : null
  useWatchContractEvent({
    address: CONTRACTS.TuringRound,
    abi: TURING_ROUND_ABI,
    eventName: 'TradeSubmitted',
    chainId: CHAIN.id,
    enabled: id != null,
    onLogs: (logs) => logs
      .filter(l => l.args.roundId === id)
      .forEach(onTrade),
  })
}

export function useRoundFinalizedEvent(roundId, onFinalized) {
  const id = roundId != null && Number.isInteger(Number(roundId)) ? BigInt(roundId) : null
  useWatchContractEvent({
    address: CONTRACTS.TuringRound,
    abi: TURING_ROUND_ABI,
    eventName: 'RoundFinalized',
    chainId: CHAIN.id,
    enabled: id != null,
    onLogs: (logs) => logs
      .filter(l => l.args.roundId === id)
      .forEach(onFinalized),
  })
}

// ── Helpers ────────────────────────────────────────────────────────────────

export const ROUND_STATE       = { Open: 0, Active: 1, Finalizing: 2, Closed: 3 }
export const ROUND_STATE_LABEL = ['OPEN', 'LIVE', 'FINALIZING', 'CLOSED']
