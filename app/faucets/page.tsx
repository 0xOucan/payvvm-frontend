"use client"

/**
 * Faucets Page - Token Faucet Claims
 *
 * Allows users to claim MATE and PYUSD test tokens
 */

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useWallet } from "@/contexts/wallet-context"
import { MateFaucet } from "@/components/payvvm/MateFaucet"
import { PyusdFaucet } from "@/components/payvvm/PyusdFaucet"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function FaucetsPage() {
  const { isConnected } = useWallet()
  const router = useRouter()

  useEffect(() => {
    if (!isConnected) {
      router.push("/")
    }
  }, [isConnected, router])

  if (!isConnected) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="mb-8 bg-card/50 backdrop-blur border-primary/50">
        <CardHeader>
          <CardTitle className="font-mono text-2xl">Test Faucets</CardTitle>
          <CardDescription>Claim test tokens for PayVVM development and testing</CardDescription>
        </CardHeader>
      </Card>

      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <MateFaucet />
        <PyusdFaucet />
      </div>

      <Card className="mt-8 max-w-4xl mx-auto bg-primary/5 border-primary/30">
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground text-pretty font-mono">
            <strong>Note:</strong> These are test faucets for development purposes only. Tokens have no real value and
            are used for testing PayVVM functionality on Sepolia testnet.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
