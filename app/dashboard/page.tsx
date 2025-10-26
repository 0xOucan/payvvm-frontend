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
import { Send, FileText, ArrowUpDown, Droplets, Search, ExternalLink, Loader2, AlertCircle } from "lucide-react"
import Link from "next/link"
import { usePyusdEvvmBalance, usePyusdWalletBalance } from "@/hooks/payvvm/usePyusdTreasury"
import { useUserBalance } from "@/hooks/payvvm/useEvvmState"
import { useBalance } from "wagmi"
import { formatUnits } from "viem"
import type { PayVVMTransaction } from "@/utils/hypersync"

interface Balance {
  symbol: string
  amount: string
}

const MATE_TOKEN = '0x0000000000000000000000000000000000000001' as `0x${string}`
const PYUSD_TOKEN = '0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9'

// Format relative time
function formatTimeAgo(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000)
  const diff = now - timestamp

  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

// Format token amount
function formatTokenAmount(amount: string, token: string): string {
  const tokenLower = token.toLowerCase()

  // PYUSD has 6 decimals
  if (tokenLower === PYUSD_TOKEN.toLowerCase()) {
    return (Number(amount) / 1e6).toFixed(2)
  }

  // MATE has 18 decimals
  if (tokenLower === MATE_TOKEN.toLowerCase()) {
    return (Number(amount) / 1e18).toFixed(2)
  }

  return amount
}

// Get token symbol
function getTokenSymbol(token: string): string {
  const tokenLower = token.toLowerCase()
  if (tokenLower === PYUSD_TOKEN.toLowerCase()) return "PYUSD"
  if (tokenLower === MATE_TOKEN.toLowerCase()) return "MATE"
  return "???"
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

  // MATE balance from EVVM
  const mateEvvmBalance = useUserBalance(address, MATE_TOKEN)

  // Recent transactions state
  const [recentTxs, setRecentTxs] = useState<PayVVMTransaction[]>([])
  const [txsLoading, setTxsLoading] = useState(false)
  const [txsError, setTxsError] = useState<string | null>(null)

  useEffect(() => {
    if (!isConnected) {
      router.push("/")
      return
    }
  }, [isConnected, router])

  // Fetch recent transactions
  useEffect(() => {
    if (!address) return

    async function fetchRecentTxs() {
      setTxsLoading(true)
      setTxsError(null)

      try {
        // Get current block from HyperSync archive height (around block 9493614)
        // Query last 10,000 blocks for recent activity
        const toBlock = 9493614  // Latest indexed block
        const fromBlock = toBlock - 10000

        const response = await fetch(
          `/api/explorer?address=${address}&type=payvvm&fromBlock=${fromBlock}&toBlock=${toBlock}&limit=5`
        )

        if (!response.ok) {
          throw new Error('Failed to fetch transactions')
        }

        const data = await response.json()

        if (data.success && data.transactions) {
          setRecentTxs(data.transactions.slice(0, 5))  // Only show 5 most recent
        }
      } catch (error) {
        console.error('Error fetching recent transactions:', error)
        setTxsError('Failed to load transactions')
      } finally {
        setTxsLoading(false)
      }
    }

    fetchRecentTxs()
  }, [address])

  if (!isConnected || !address) {
    return null
  }

  const loading = pyusdEvvmBalance.isLoading || pyusdWalletBalance.isLoading || ethBalance.isLoading || mateEvvmBalance.isLoading

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
      amount: mateEvvmBalance.data ? parseFloat(formatUnits(mateEvvmBalance.data, 18)).toFixed(2) : "0.00",
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
                <ArrowUpDown className="h-5 w-5" />
                <span className="text-xs font-mono">Treasury</span>
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
          <Button asChild variant="ghost" size="sm" className="gap-2 hover:bg-primary/10">
            <Link href="/explorer">
              View all
              <ExternalLink className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {txsLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}

          {txsError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">{txsError}</AlertDescription>
            </Alert>
          )}

          {!txsLoading && !txsError && recentTxs.length === 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                No recent transactions found. Try sending a payment or using the faucets!
              </AlertDescription>
            </Alert>
          )}

          {!txsLoading && !txsError && recentTxs.length > 0 && (
            <div className="space-y-3">
              {recentTxs.map((tx) => {
                const tokenSymbol = getTokenSymbol(tx.token)
                const amount = formatTokenAmount(tx.amount, tx.token)
                const timeAgo = formatTimeAgo(tx.timestamp)
                const counterparty = tx.type === 'send' ? tx.to : tx.from

                return (
                  <div
                    key={tx.hash}
                    className="flex items-center justify-between py-3 border-b border-primary/20 last:border-0 hover:bg-primary/5 px-2 rounded transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Badge
                        variant={tx.type === 'send' ? 'default' : 'secondary'}
                        className="font-mono text-xs shrink-0"
                      >
                        {tx.type}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate font-mono">
                          {counterparty.slice(0, 6)}...{counterparty.slice(-4)}
                        </p>
                        <p className="text-xs text-muted-foreground">{timeAgo}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono font-semibold text-sm">
                        {tx.type === 'send' ? '-' : '+'}{amount} {tokenSymbol}
                      </p>
                      <a
                        href={`https://sepolia.etherscan.io/tx/${tx.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1"
                      >
                        View
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
