"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAccount } from "wagmi"
import { DebitCard } from "@/components/payvvm/DebitCard"
import { BalanceCard } from "@/components/payvvm/BalanceCard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Send, FileText, ArrowDownToLine, Droplets, Search, ExternalLink, Loader2, AlertCircle } from "lucide-react"
import Link from "next/link"
import { usePyusdEvvmBalance, usePyusdWalletBalance } from "@/hooks/payvvm/usePyusdTreasury"
import { useBalance } from "wagmi"
import { formatUnits } from "viem"

interface Balance {
  symbol: string
  amount: string
}

export default function DashboardPage() {
  const { address, isConnected } = useAccount()
  const router = useRouter()

  // EVVM Balances (for debit card)
  const pyusdEvvmBalance = usePyusdEvvmBalance()

  // Wallet Balances
  const pyusdWalletBalance = usePyusdWalletBalance()
  const ethBalance = useBalance({
    address: address,
  })

  // MATE balance from EVVM (using mock for now - TODO: implement real MATE balance hook)
  const [mateBalance, setMateBalance] = useState("0.00")

  useEffect(() => {
    if (!isConnected) {
      router.push("/")
      return
    }
  }, [isConnected, router])

  if (!isConnected || !address) {
    return null
  }

  const loading = pyusdEvvmBalance.isLoading || pyusdWalletBalance.isLoading || ethBalance.isLoading

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  // Prepare balance data
  const mateBalances: Balance[] = [
    {
      symbol: "MATE",
      amount: mateBalance,
    },
  ]

  const nativeBalances: Balance[] = [
    {
      symbol: "ETH",
      amount: ethBalance.data ? parseFloat(formatUnits(ethBalance.data.value, 18)).toFixed(4) : "0.0000",
    },
  ]

  const walletPyusdBalances: Balance[] = [
    {
      symbol: "PYUSD",
      amount: parseFloat(pyusdWalletBalance.formatted).toFixed(2),
    },
  ]

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
        {/* Left Column - Debit Card */}
        <div className="lg:col-span-2 space-y-6">
          {/* PYUSD Debit Card */}
          <DebitCard
            label="PAYVVM DEBIT"
            address={address}
            balance={parseFloat(pyusdEvvmBalance.formatted).toFixed(2)}
            symbol="PYUSD"
          />

          {/* Action Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Button asChild variant="outline" className="flex-col h-auto py-4 gap-2 bg-transparent border-primary/50 hover:bg-primary/5">
              <Link href="/send">
                <Send className="h-5 w-5" />
                <span className="text-xs font-mono">Send</span>
              </Link>
            </Button>

            <Button asChild variant="outline" className="flex-col h-auto py-4 gap-2 bg-transparent border-primary/50 hover:bg-primary/5">
              <Link href="/invoice">
                <FileText className="h-5 w-5" />
                <span className="text-xs font-mono">Invoice</span>
              </Link>
            </Button>

            <Button asChild variant="outline" className="flex-col h-auto py-4 gap-2 bg-transparent border-primary/50 hover:bg-primary/5">
              <Link href="/withdraw">
                <ArrowDownToLine className="h-5 w-5" />
                <span className="text-xs font-mono">Withdraw</span>
              </Link>
            </Button>

            <Button asChild variant="outline" className="flex-col h-auto py-4 gap-2 bg-transparent border-primary/50 hover:bg-primary/5">
              <Link href="/faucets">
                <Droplets className="h-5 w-5" />
                <span className="text-xs font-mono">Faucets</span>
              </Link>
            </Button>

            <Button asChild variant="outline" className="flex-col h-auto py-4 gap-2 bg-transparent border-primary/50 hover:bg-primary/5">
              <Link href="/explorer">
                <Search className="h-5 w-5" />
                <span className="text-xs font-mono">Explorer</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Right Column - Other Balances */}
        <div className="space-y-6">
          {/* MATE Balance */}
          <BalanceCard title="MATE Balance" tokens={mateBalances} />

          {/* Native Balance */}
          <BalanceCard title="Native Balance" tokens={nativeBalances} />

          {/* Wallet PYUSD Balance */}
          <Card className="bg-card/50 backdrop-blur border-primary/50">
            <CardHeader>
              <CardTitle className="text-sm font-mono">Wallet PYUSD</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {walletPyusdBalances.map((token) => (
                <div key={token.symbol} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{token.symbol}</span>
                  <span className="font-mono font-semibold">{token.amount}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-primary/20">
                <p className="text-xs text-muted-foreground">On Ethereum Sepolia</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Activity Feed */}
      <Card className="mt-8 bg-card/50 backdrop-blur border-primary/50">
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
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Transaction history coming soon. Data will be fetched from Envio HyperSync.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}
