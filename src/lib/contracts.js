// ── Addresses — filled in after deployment ────────────────────────────────
// Run: npx hardhat run scripts/deploy.js --network mantleSepolia
export const CONTRACTS = {
  TuringRound:   '0x5FdD4800B445859DF57B4D987ab12a7C6466FCB3',
  AgentRegistry: '0x11138917b6Dd0782C8Ef98AC7EBB0c3Bd5706ccE',
  ReasoningLog:  '0x668AA46d926bA4e5F76EAf2242f3FD3Ffc0F5C09',
  TradeExecutor: '0x2616442740a423E607A51C164add8072c2A90bC3',
}

export const IS_TESTNET = true  // flip to false when going mainnet

export const MANTLE_EXPLORER         = 'https://explorer.mantle.xyz'
export const MANTLE_TESTNET_EXPLORER = 'https://explorer.sepolia.mantle.xyz'

export const explorerTx = (hash) =>
  `${IS_TESTNET ? MANTLE_TESTNET_EXPLORER : MANTLE_EXPLORER}/tx/${hash}`

export const explorerAddress = (addr) =>
  `${IS_TESTNET ? MANTLE_TESTNET_EXPLORER : MANTLE_EXPLORER}/address/${addr}`

// ── ABIs ──────────────────────────────────────────────────────────────────

export const TURING_ROUND_ABI = [
  // views
  { name: 'roundCount',       type: 'function', stateMutability: 'view',     inputs: [],                                                                              outputs: [{ type: 'uint256' }] },
  { name: 'getRound',         type: 'function', stateMutability: 'view',     inputs: [{ name: 'roundId', type: 'uint256' }],                                          outputs: [{ type: 'tuple', components: [{ name: 'id', type: 'uint256' }, { name: 'entryFee', type: 'uint256' }, { name: 'prizePool', type: 'uint256' }, { name: 'startTime', type: 'uint256' }, { name: 'endTime', type: 'uint256' }, { name: 'state', type: 'uint8' }, { name: 'participantList', type: 'address[]' }, { name: 'winner', type: 'address' }, { name: 'winnerRoiBps', type: 'int256' }] }] },
  { name: 'getParticipants',  type: 'function', stateMutability: 'view',     inputs: [{ name: 'roundId', type: 'uint256' }],                                          outputs: [{ type: 'address[]' }] },
  { name: 'getParticipant',   type: 'function', stateMutability: 'view',     inputs: [{ name: 'roundId', type: 'uint256' }, { name: 'addr', type: 'address' }],        outputs: [{ type: 'tuple', components: [{ name: 'addr', type: 'address' }, { name: 'isAI', type: 'bool' }, { name: 'roiBps', type: 'int256' }, { name: 'tradeCount', type: 'uint256' }, { name: 'liquidated', type: 'bool' }, { name: 'claimed', type: 'bool' }] }] },
  // writes
  { name: 'owner',            type: 'function', stateMutability: 'view',       inputs: [],                                                                              outputs: [{ type: 'address' }] },
  { name: 'createRound',     type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'entryFee', type: 'uint256' }, { name: 'startTime', type: 'uint256' }, { name: 'endTime', type: 'uint256' }], outputs: [{ type: 'uint256' }] },
  { name: 'activateRound',   type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'roundId', type: 'uint256' }], outputs: [] },
  { name: 'topUpPrize',      type: 'function', stateMutability: 'payable',    inputs: [{ name: 'roundId', type: 'uint256' }], outputs: [] },
  { name: 'enter',            type: 'function', stateMutability: 'payable',  inputs: [{ name: 'roundId', type: 'uint256' }, { name: 'isAI', type: 'bool' }],           outputs: [] },
  { name: 'submitTrade',      type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'roundId', type: 'uint256' }, { name: 'pair', type: 'string' }, { name: 'amountBps', type: 'int256' }, { name: 'isBuy', type: 'bool' }, { name: 'reasoning', type: 'string' }], outputs: [{ type: 'uint256' }] },
  { name: 'submitResults',    type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'roundId', type: 'uint256' }, { name: 'addrs', type: 'address[]' }, { name: 'roiBpsArr', type: 'int256[]' }, { name: 'liquidatedArr', type: 'bool[]' }], outputs: [] },
  { name: 'claimPrize',       type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'roundId', type: 'uint256' }],                                        outputs: [] },
  // events
  { name: 'RoundCreated',     type: 'event', inputs: [{ name: 'roundId', type: 'uint256', indexed: true }, { name: 'entryFee', type: 'uint256' }, { name: 'startTime', type: 'uint256' }, { name: 'endTime', type: 'uint256' }] },
  { name: 'ParticipantEntered', type: 'event', inputs: [{ name: 'roundId', type: 'uint256', indexed: true }, { name: 'participant', type: 'address', indexed: true }, { name: 'isAI', type: 'bool' }] },
  { name: 'TradeSubmitted',   type: 'event', inputs: [{ name: 'roundId', type: 'uint256', indexed: true }, { name: 'trader', type: 'address', indexed: true }, { name: 'pair', type: 'string' }, { name: 'amountBps', type: 'int256' }, { name: 'isBuy', type: 'bool' }, { name: 'logEntryId', type: 'uint256' }] },
  { name: 'RoundFinalized',   type: 'event', inputs: [{ name: 'roundId', type: 'uint256', indexed: true }, { name: 'winner', type: 'address', indexed: true }, { name: 'winnerRoiBps', type: 'int256' }, { name: 'prize', type: 'uint256' }] },
]

export const AGENT_REGISTRY_ABI = [
  { name: 'nextTokenId',      type: 'function', stateMutability: 'view',       inputs: [],                                                                              outputs: [{ type: 'uint256' }] },
  { name: 'ownerToAgent',     type: 'function', stateMutability: 'view',       inputs: [{ name: 'owner', type: 'address' }],                                           outputs: [{ type: 'uint256' }] },
  { name: 'getAgent',         type: 'function', stateMutability: 'view',       inputs: [{ name: 'tokenId', type: 'uint256' }],                                         outputs: [{ type: 'tuple', components: [{ name: 'name', type: 'string' }, { name: 'strategyHash', type: 'string' }, { name: 'owner', type: 'address' }, { name: 'roundsEntered', type: 'uint256' }, { name: 'roundsWon', type: 'uint256' }, { name: 'totalRoi', type: 'int256' }, { name: 'registeredAt', type: 'uint256' }] }] },
  { name: 'reputationScore',  type: 'function', stateMutability: 'view',       inputs: [{ name: 'tokenId', type: 'uint256' }],                                         outputs: [{ type: 'uint256' }] },
  { name: 'registerAgent',    type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'name', type: 'string' }, { name: 'strategyHash', type: 'string' }],   outputs: [{ type: 'uint256' }] },
  { name: 'AgentRegistered',  type: 'event',   inputs: [{ name: 'tokenId', type: 'uint256', indexed: true }, { name: 'owner', type: 'address', indexed: true }, { name: 'name', type: 'string' }] },
]

export const REASONING_LOG_ABI = [
  { name: 'entryCount',       type: 'function', stateMutability: 'view', inputs: [],                                                                              outputs: [{ type: 'uint256' }] },
  { name: 'getEntry',         type: 'function', stateMutability: 'view', inputs: [{ name: 'entryId', type: 'uint256' }],                                          outputs: [{ type: 'tuple', components: [{ name: 'agent', type: 'address' }, { name: 'roundId', type: 'uint256' }, { name: 'reasoning', type: 'string' }, { name: 'dataHash', type: 'bytes32' }, { name: 'timestamp', type: 'uint256' }, { name: 'blockNumber', type: 'uint256' }] }] },
  { name: 'getAgentRoundEntries', type: 'function', stateMutability: 'view', inputs: [{ name: 'agent', type: 'address' }, { name: 'roundId', type: 'uint256' }], outputs: [{ type: 'uint256[]' }] },
  { name: 'ReasoningLogged',  type: 'event', inputs: [{ name: 'entryId', type: 'uint256', indexed: true }, { name: 'agent', type: 'address', indexed: true }, { name: 'roundId', type: 'uint256', indexed: true }, { name: 'reasoning', type: 'string' }, { name: 'dataHash', type: 'bytes32' }, { name: 'timestamp', type: 'uint256' }] },
]
