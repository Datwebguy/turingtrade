// Mock data — replace with real contract reads after deployment

const now = Date.now()
const m = 60 * 1000, h = 60 * m

export const GLOBAL_STATS = {
  totalVolume: 420841,
  activeAgents: 38,
  humanTraders: 14,
  aiWinRate: 66,
  roundNumber: 12,
}

export const ROUNDS = [
  { id: 'r12', number: 12, status: 'LIVE',          humans: 14, agents: 22, endsAt: now + 30*m,        prize: 4250,  minEntry: 100 },
  { id: 'r13', number: 13, status: 'STARTING SOON', humans: 6,  agents: 11, endsAt: now + 87*m + 35*1000, prize: 1800, minEntry: 50 },
  { id: 'r14', number: 14, status: 'OPEN',           humans: 2,  agents: 4,  endsAt: now + 5*h + 57*m,  prize: 600,   minEntry: 25 },
]

export const AGENTS = [
  {
    id: 'a0042', number: '0042', name: 'DeltaBot-X', strategy: ['Momentum', 'LSTM'],
    owner: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
    rounds: 12, winRate: 67, bestRoi: 31.2, worstRoi: -8.1, avgRoi: 14.2, liquidations: 0,
    totalVolume: 284100, reputationScore: 84,
    pnlHistory: [2.1, -1.3, 8.4, 5.2, -2.1, 11.7, 3.3, 14.2, -0.8, 9.1, 6.5, 31.2],
    trades: [
      { id: 't1', action: 'BUY',  pair: 'USDC→WETH', amount: '320 USDC', price: '$2,841', outcome: 6.2,  tx: '0x91a2ef41', reasoning: 'RSI crossed 58 from below. WETH/USDC volume up 34% in last 2 blocks. Macro: ETH funding rate neutral. Entering 20% position. Stop at $2,780.', ts: now - 2*h },
      { id: 't2', action: 'SELL', pair: 'WETH→USDC', amount: '0.11 WETH', price: '$3,017', outcome: 6.2,  tx: '0xb82c1d52', reasoning: 'Target hit +6.2%. Closing position. Momentum fading, RSI divergence forming.', ts: now - 1*h },
      { id: 't3', action: 'BUY',  pair: 'USDC→MNT',  amount: '500 USDC', price: '$1.24',  outcome: -2.1, tx: '0xc93e2f63', reasoning: 'MNT support level retest. Volume spike detected. Entering with 25% position size.', ts: now - 45*m },
    ],
  },
]

export const FEED = [
  { id: 'f1',  kind: 'ai',    who: 'DeltaBot-X',   action: 'Bought 320 USDC → WETH',  reasoning: 'RSI crossed 58. Volume up 34%. Entering 20% position.', tx: '0x91a2...ef41', time: '2m ago' },
  { id: 'f2',  kind: 'human', who: '0x_Sara',       action: 'Sold 150 WETH → USDC',    reasoning: null,                                                       tx: '0x72b3...9f12', time: '4m ago' },
  { id: 'f3',  kind: 'ai',    who: 'NeuralFi',      action: 'Bought 800 USDC → MNT',   reasoning: 'Support retest. Entering long. SL at 1.18.',               tx: '0xc44d...8a01', time: '6m ago' },
  { id: 'f4',  kind: 'human', who: 'ProMint',        action: 'Sold 2.4 WETH → USDC',   reasoning: null,                                                       tx: '0x55ef...3b77', time: '9m ago' },
  { id: 'f5',  kind: 'ai',    who: 'ArbiBot',        action: 'Bought 1200 USDC → WETH', reasoning: 'Funding rate flip. Arb window open. 15s execution.',       tx: '0xd66f...2c88', time: '11m ago' },
  { id: 'f6',  kind: 'human', who: '0xkrypto',       action: 'Bought 500 USDC → MNT',  reasoning: null,                                                       tx: '0xe77a...1d99', time: '14m ago' },
  { id: 'f7',  kind: 'ai',    who: 'DeltaBot-X',    action: 'Sold 0.11 WETH → USDC',   reasoning: 'Target +6.2% reached. Closing. RSI divergence forming.',   tx: '0xf88b...0eaa', time: '17m ago' },
  { id: 'f8',  kind: 'human', who: 'moon_wallet',   action: 'Bought 300 USDC → WETH',  reasoning: null,                                                       tx: '0xa99c...fbb1', time: '21m ago' },
]

export const ROUND_RESULTS = {
  r11: {
    number: 11,
    winner: { name: 'DeltaBot-X', kind: 'ai', roi: 31.2, prize: 3200 },
    humanAvgRoi: -8.4, aiAvgRoi: 11.7,
    topHuman: { name: 'ProMint', roi: 11.2 },
    topAi:    { name: 'DeltaBot-X', roi: 31.2 },
    humansLiquidated: 3, aisLiquidated: 1,
    totalParticipants: 36,
    yourRank: 6, yourRoi: -4.1, yourXP: 120,
  },
}

export const LEADERBOARD = [
  { rank: 1, name: 'DeltaBot-X', kind: 'ai',    roi: 18.4, sparkline: [2,5,4,8,6,12,15,18], addr: '0x1a2b...9a0b' },
  { rank: 2, name: 'ProMint',    kind: 'human',  roi: 11.2, sparkline: [1,3,6,4,9,8,10,11], addr: '0x2b3c...ab1c' },
  { rank: 3, name: 'NeuralFi',   kind: 'ai',    roi:  9.7, sparkline: [3,2,5,7,6,8,9,10],  addr: '0x3c4d...bc2d' },
  { rank: 4, name: '0x_Sara',    kind: 'human',  roi:  6.1, sparkline: [1,4,3,5,4,6,5,6],  addr: '0x4d5e...cd3e' },
  { rank: 5, name: 'ArbiBot',    kind: 'ai',    roi: -2.3, sparkline: [5,3,4,2,3,1,0,-2],  addr: '0x5e6f...de4f' },
  { rank: 6, name: 'You',        kind: 'human',  roi: -4.1, sparkline: [2,1,3,0,2,-1,-3,-4], addr: '0x0000...0000', isYou: true },
]
