/**
 * Wagmi Configuration for PayVVM Frontend
 *
 * Configures wallet connectors, chains, and transports for Web3 integration
 */

import { createConfig, http, fallback } from 'wagmi'
import { walletConnect, coinbaseWallet, injected } from 'wagmi/connectors'
import { sepolia, arbitrumSepolia } from './chains'

// Get WalletConnect Project ID from environment
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || ''

if (!projectId && typeof window !== 'undefined') {
  console.warn(
    '⚠️ WalletConnect Project ID is missing! Get one at https://cloud.walletconnect.com'
  )
}

export const wagmiConfig = createConfig({
  chains: [sepolia, arbitrumSepolia],
  connectors: [
    // Injected connector for browser wallets (MetaMask, etc.)
    injected({
      shimDisconnect: true,
    }),

    // WalletConnect v2
    walletConnect({
      projectId,
      metadata: {
        name: 'PayVVM',
        description: 'Gasless PYUSD wallet powered by EVVM',
        url: typeof window !== 'undefined' ? window.location.origin : '',
        icons: ['https://www.payvvm.com/icon.png'], // TODO: Replace with actual icon
      },
      showQrModal: true,
    }),

    // Coinbase Wallet
    coinbaseWallet({
      appName: 'PayVVM',
      appLogoUrl: 'https://www.payvvm.com/icon.png', // TODO: Replace with actual icon
    }),
  ],
  transports: {
    [sepolia.id]: fallback(
      sepolia.rpcUrls.default.http.map((url) => http(url))
    ),
    [arbitrumSepolia.id]: fallback(
      arbitrumSepolia.rpcUrls.default.http.map((url) => http(url))
    ),
  },
  ssr: true, // Enable SSR support for Next.js
})
