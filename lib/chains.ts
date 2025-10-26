/**
 * Chain Definitions for PayVVM Frontend
 *
 * Configured for Ethereum Sepolia testnet (primary)
 * and Arbitrum Sepolia (cross-chain support)
 */

import { defineChain } from 'viem'

export const sepolia = defineChain({
  id: 11155111,
  name: 'Sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'Sepolia Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: [
        'https://ethereum-sepolia-rpc.publicnode.com',
        'https://rpc2.sepolia.org',
        'https://sepolia.gateway.tenderly.co',
        'https://rpc.sepolia.org',
      ],
    },
    public: {
      http: [
        'https://ethereum-sepolia-rpc.publicnode.com',
        'https://rpc2.sepolia.org',
        'https://rpc.sepolia.org',
      ],
    },
  },
  blockExplorers: {
    default: {
      name: 'Etherscan',
      url: 'https://sepolia.etherscan.io',
    },
  },
  testnet: true,
})

export const arbitrumSepolia = defineChain({
  id: 421614,
  name: 'Arbitrum Sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'Arbitrum Sepolia Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: [
        'https://arbitrum-sepolia.blockpi.network/v1/rpc/public',
        'https://sepolia-rollup.arbitrum.io/rpc',
        'https://arbitrum-sepolia-rpc.publicnode.com',
      ],
    },
    public: {
      http: [
        'https://arbitrum-sepolia.blockpi.network/v1/rpc/public',
        'https://sepolia-rollup.arbitrum.io/rpc',
      ],
    },
  },
  blockExplorers: {
    default: {
      name: 'Arbiscan',
      url: 'https://sepolia.arbiscan.io',
    },
  },
  testnet: true,
})

// Export default chain for PayVVM
export const defaultChain = sepolia
