"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useWallet } from "@/contexts/wallet-context"
import { DebitCard } from "@/components/debit-card"
import { BalanceCard } from "@/components/balance-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Send, FileText, ArrowDownToLine, Droplets, Search, ExternalLink } from "lucide-react"
import Link from "next/link"
import { getEvvmBalances, getNativeBalances, getExplorerFeed } from "@/services/evvm"
import type { Balance, Transaction } from "@/lib/mock"

export default function DashboardPage() {
  const { address, isConnected } = useWallet()
  const router = useRouter()
  const [evvmBalances, setEvvmBalances] = useState<Balance[]>([])
  const [nativeBalances, setNativeBalances] = useState<Balance[]>([])
  const [recentTxs, setRecentTxs] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isConnected) {
      router.push("/")
      return
    }

    async function loadData() {
      if (!address) return

      try {
        const [evvm, native, txs] = await Promise.all([
          getEvvmBalances(address),
          getNativeBalances(address),
          getExplorerFeed({ limit: 5 }),
        ])

        setEvvmBalances(evvm)
        setNativeBalances(native)
        setRecentTxs(txs)
      } catch (error) {
        console.error("[v0] Failed to load dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [address, isConnected, router])

  if (!isConnected || !address) {
    return null
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <p className="text-muted-foreground font-mono">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const pyusdBalance = evvmBalances.find((b) => b.symbol === "PYUSD")
  const mateBalance = evvmBalances.find((b) => b.symbol === "MATE")

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Strip */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm text-muted-foreground">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
          <Badge variant="outline" className="font-mono text-xs">
            Sepolia
          </Badge>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Cards */}
        <div className="lg:col-span-2 space-y-6">
          {/* PYUSD Debit Card */}
          {pyusdBalance && (
            <DebitCard label="PYUSD Balance" address={address} balance={pyusdBalance.amount} symbol="PYUSD" />
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Button asChild variant="outline" className="flex-col h-auto py-4 gap-2 bg-transparent">
              <Link href="/send">
                <Send className="h-5 w-5" />
                <span className="text-xs">Send</span>
              </Link>
            </Button>

            <Button asChild variant="outline" className="flex-col h-auto py-4 gap-2 bg-transparent">
              <Link href="/invoice">
                <FileText className="h-5 w-5" />
                <span className="text-xs">Invoice</span>
              </Link>
            </Button>

            <Button asChild variant="outline" className="flex-col h-auto py-4 gap-2 bg-transparent">
              <Link href="/withdraw">
                <ArrowDownToLine className="h-5 w-5" />
                <span className="text-xs">Withdraw</span>
              </Link>
            </Button>

            <Button asChild variant="outline" className="flex-col h-auto py-4 gap-2 bg-transparent">
              <Link href="/faucets">
                <Droplets className="h-5 w-5" />
                <span className="text-xs">Faucets</span>
              </Link>
            </Button>

            <Button asChild variant="outline" className="flex-col h-auto py-4 gap-2 bg-transparent">
              <Link href="/explorer">
                <Search className="h-5 w-5" />
                <span className="text-xs">Explorer</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Right Column - Other Balances */}
        <div className="space-y-6">
          {mateBalance && <BalanceCard title="MATE Balance" tokens={[mateBalance]} />}
          {nativeBalances.length > 0 && <BalanceCard title="Native Balance" tokens={nativeBalances} />}
        </div>
      </div>

      {/* Activity Feed */}
      <Card className="mt-8 bg-card/50 backdrop-blur">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-mono">Recent Activity</CardTitle>
          <Button asChild variant="ghost" size="sm" className="gap-2">
            <Link href="/explorer">
              View all
              <ExternalLink className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentTxs.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="font-mono text-xs capitalize">
                    {tx.type}
                  </Badge>
                  <div>
                    <p className="text-sm font-medium">{tx.counterparty}</p>
                    <p className="text-xs text-muted-foreground">{tx.time} ago</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono font-semibold">
                    {tx.amount} {tx.token}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
