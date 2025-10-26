"use client"

/**
 * Send Page - PYUSD Payment Interface
 *
 * Allows users to send gasless PYUSD payments using EVVM
 */

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useWallet } from "@/contexts/wallet-context"
import { PyusdPayment } from "@/components/payvvm/PyusdPayment"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function SendPage() {
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
    <div className="container mx-auto px-4 py-8 max-w-md">
      <Card className="bg-card/50 backdrop-blur border-primary/50">
        <CardHeader>
          <CardTitle className="font-mono">Send PYUSD (Gasless)</CardTitle>
          <CardDescription className="text-muted-foreground">
            Sign with EIP-191, fishers execute the transaction
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PyusdPayment />
        </CardContent>
      </Card>

      <div className="mt-6 text-center">
        <p className="text-xs text-muted-foreground font-mono">
          Gasless transactions are powered by EVVM. No ETH required for gas fees.
        </p>
      </div>
    </div>
  )
}
