"use client"

/**
 * Dashboard Page - Main PAYVVM Wallet Interface
 *
 * Displays:
 * - EVVM System Dashboard (metadata, stats)
 * - User Account Viewer (balances, nonce, staker status)
 * - PYUSD Debit Card UI with real balances
 * - Treasury Management (deposit/withdraw)
 * - Transaction History
 */

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useWallet } from "@/contexts/wallet-context"
import { EvvmDashboard } from "@/components/payvvm/EvvmDashboard"
import { AccountViewer } from "@/components/payvvm/AccountViewer"
import { PyusdTreasury } from "@/components/payvvm/PyusdTreasury"
import { TransactionHistory } from "@/components/payvvm/TransactionHistory"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function DashboardPage() {
  const router = useRouter()
  const { isConnected, address } = useWallet()

  // Redirect to home if not connected
  useEffect(() => {
    if (!isConnected) {
      router.push("/")
    }
  }, [isConnected, router])

  if (!isConnected || !address) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Connect Wallet</CardTitle>
            <CardDescription>Please connect your wallet to view your dashboard</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Manage your PAYVVM wallet and PYUSD payments</p>
      </div>

      {/* EVVM System Dashboard */}
      <EvvmDashboard />

      {/* User Account Information */}
      <AccountViewer address={address} />

      {/* Treasury Management */}
      <Card>
        <CardHeader>
          <CardTitle>Treasury Management</CardTitle>
          <CardDescription>Deposit and withdraw PYUSD from PAYVVM</CardDescription>
        </CardHeader>
        <CardContent>
          <PyusdTreasury />
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>View your recent PAYVVM transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <TransactionHistory address={address} limit={10} />
        </CardContent>
      </Card>
    </div>
  )
}
