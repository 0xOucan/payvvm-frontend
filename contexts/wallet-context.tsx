'use client'

/**
 * Wallet Context for PayVVM Frontend
 *
 * Provides wallet connection state and utilities using Wagmi hooks.
 * This replaces the previous mock implementation with real Web3 integration.
 */

import { createContext, useContext, type ReactNode } from 'react'
import { useAccount, useDisconnect, useBalance } from 'wagmi'
import type { Address } from 'viem'

interface WalletContextType {
  isConnected: boolean
  address: Address | undefined
  disconnect: () => void
  balance: bigint | undefined
  isLoading: boolean
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: ReactNode }) {
  // Get wallet connection state from Wagmi
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()

  // Get native ETH balance
  const { data: balanceData, isLoading } = useBalance({
    address,
  })

  const value: WalletContextType = {
    isConnected,
    address,
    disconnect,
    balance: balanceData?.value,
    isLoading,
  }

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return context
}
