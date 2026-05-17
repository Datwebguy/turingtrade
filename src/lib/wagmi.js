import { http } from 'wagmi'
import { defineChain } from 'viem'
import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { IS_TESTNET } from './contracts'

export const mantle = defineChain({
  id: 5000,
  name: 'Mantle',
  nativeCurrency: { name: 'Mantle', symbol: 'MNT', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.mantle.xyz'] },
    public:  { http: ['https://rpc.mantle.xyz'] },
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
    default: { http: ['https://rpc.sepolia.mantle.xyz'] },
    public:  { http: ['https://rpc.sepolia.mantle.xyz'] },
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
    [mantle.id]:        http('https://rpc.mantle.xyz'),
    [mantleTestnet.id]: http('https://rpc.sepolia.mantle.xyz'),
  },
})
