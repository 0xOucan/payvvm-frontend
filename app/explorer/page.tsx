"use client"

/**
 * Explorer Page - Transaction History
 *
 * Displays PAYVVM transaction history using HyperSync
 */

import { useEffect } from "react"
import { useWallet } from "@/contexts/wallet-context"
import { TransactionHistory } from "@/components/payvvm/TransactionHistory"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity } from "lucide-react"

export default function ExplorerPage() {
  const { address } = useWallet()

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="mb-8 bg-card/50 backdrop-blur">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-mono text-2xl">PayVVM Scan</CardTitle>
              <CardDescription>Explorer for EVVM-powered payments</CardDescription>
            </div>
            <Badge variant="outline" className="gap-2 font-mono">
              <Activity className="h-3 w-3 animate-pulse text-primary" />
              HyperSync Connected
            </Badge>
          </div>
        </CardHeader>
      </Card>

      <TransactionHistory address={address} limit={50} />
    </div>
  )
}
