/**
 * Wagmi Configuration for PayVVM Frontend
 *
 * Uses RainbowKit's getDefaultConfig for optimal mobile wallet support
 */

import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { sepolia, arbitrumSepolia } from './chains'

// Get WalletConnect Project ID from environment
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '01a7fca81220c5264967fa2cf6f49549'

if (!projectId && typeof window !== 'undefined') {
  console.warn(
    '⚠️ WalletConnect Project ID is missing! Get one at https://cloud.walletconnect.com'
  )
}

export const wagmiConfig = getDefaultConfig({
  appName: 'PayVVM',
  projectId,
  chains: [sepolia, arbitrumSepolia],
  ssr: true, // Enable SSR support for Next.js
})
