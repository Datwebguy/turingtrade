import { http, fallback } from 'wagmi'
import { defineChain } from 'viem'
import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { IS_TESTNET } from './contracts'

// Allow custom RPCs via env vars — useful when the public endpoint is rate-limited
const sepoliaRpcs = [
  import.meta.env.VITE_RPC_SEPOLIA_URL,
  'https://rpc.sepolia.mantle.xyz',
  'https://mantle-sepolia.drpc.org',
].filter(Boolean)

const mainnetRpcs = [
  import.meta.env.VITE_RPC_MAINNET_URL,
  'https://rpc.mantle.xyz',
  'https://mantle.drpc.org',
].filter(Boolean)

export const mantle = defineChain({
  id: 5000,
  name: 'Mantle',
  nativeCurrency: { name: 'Mantle', symbol: 'MNT', decimals: 18 },
  rpcUrls: {
    default: { http: mainnetRpcs },
    public:  { http: mainnetRpcs },
  },
  blockExplorers: {
    default: { name: 'Mantle Explorer', url: 'https://explorer.mantle.xyz' },
  },
})

export const mantleTestnet = defineChain({
  id: 5003,
  name: 'Mantle Sepolia Testnet',
  nativeCurrency: { name: 'Mantle', symbol: 'MNT', decimals: 18 },
  rpcUrls: {
    default: { http: sepoliaRpcs },
    public:  { http: sepoliaRpcs },
  },
  blockExplorers: {
    default: { name: 'Mantle Testnet Explorer', url: 'https://explorer.sepolia.mantle.xyz' },
  },
  testnet: true,
})

export const wagmiConfig = getDefaultConfig({
  appName: 'TuringTrade',
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains: IS_TESTNET ? [mantleTestnet, mantle] : [mantle, mantleTestnet],
  transports: {
    [mantle.id]:        fallback(mainnetRpcs.map(url => http(url, { timeout: 10_000 }))),
    [mantleTestnet.id]: fallback(sepoliaRpcs.map(url => http(url, { timeout: 10_000 }))),
  },
})
