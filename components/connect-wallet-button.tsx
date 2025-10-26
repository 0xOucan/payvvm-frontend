"use client"

import { useWallet } from "@/contexts/wallet-context"
import { Button } from "@/components/ui/button"

export function ConnectWalletButton() {
  const { address, isConnected, connect, disconnect } = useWallet()

  if (isConnected && address) {
    return (
      <Button variant="outline" size="sm" onClick={disconnect} className="font-mono text-xs bg-transparent">
        {address.slice(0, 6)}...{address.slice(-4)}
      </Button>
    )
  }

  return (
    <Button size="sm" onClick={connect} className="font-mono text-xs glitch-hover">
      Connect Wallet
    </Button>
  )
}
