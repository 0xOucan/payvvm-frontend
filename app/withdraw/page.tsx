"use client"

/**
 * Withdraw Page - PYUSD Withdrawal Interface
 *
 * Allows users to withdraw PYUSD from EVVM to Ethereum Sepolia
 */

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useWallet } from "@/contexts/wallet-context"
import { PyusdTreasury } from "@/components/payvvm/PyusdTreasury"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function WithdrawPage() {
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
      <div className="mb-6">
        <Button asChild variant="ghost" size="sm" className="gap-2">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-mono">Treasury Management</CardTitle>
          <CardDescription>Deposit and withdraw PYUSD from PAYVVM</CardDescription>
        </CardHeader>
        <CardContent>
          <PyusdTreasury />
        </CardContent>
      </Card>
    </div>
  )
}
