"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"

interface WalletContextType {
  address: string | null
  isConnected: boolean
  connect: () => Promise<void>
  disconnect: () => void
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Check for stored connection
    const stored = localStorage.getItem("payvvm-wallet-address")
    if (stored) {
      setAddress(stored)
      setIsConnected(true)
    }
  }, [])

  const connect = async () => {
    // TODO: Implement real WalletConnect / Reown Kit integration
    // For now, use mock address
    const mockAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
    setAddress(mockAddress)
    setIsConnected(true)
    localStorage.setItem("payvvm-wallet-address", mockAddress)
  }

  const disconnect = () => {
    setAddress(null)
    setIsConnected(false)
    localStorage.removeItem("payvvm-wallet-address")
  }

  return (
    <WalletContext.Provider value={{ address, isConnected, connect, disconnect }}>{children}</WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error("useWallet must be used within WalletProvider")
  }
  return context
}
