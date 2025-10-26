"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useWallet } from "@/contexts/wallet-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react"
import Link from "next/link"
import { withdrawPyusdToSepolia, getEvvmBalances } from "@/services/evvm"
import { useToast } from "@/hooks/use-toast"

export default function WithdrawPage() {
  const { address, isConnected } = useWallet()
  const router = useRouter()
  const { toast } = useToast()

  const [amount, setAmount] = useState("")
  const [balance, setBalance] = useState("0.00")
  const [loading, setLoading] = useState(false)
  const [needsApproval, setNeedsApproval] = useState(false)
  const [approving, setApproving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)

  useEffect(() => {
    if (!isConnected) {
      router.push("/")
      return
    }

    async function loadBalance() {
      if (!address) return
      const balances = await getEvvmBalances(address)
      const pyusd = balances.find((b) => b.symbol === "PYUSD")
      if (pyusd) {
        setBalance(pyusd.amount)
      }
    }

    loadBalance()
  }, [address, isConnected, router])

  const handleCheckAllowance = async () => {
    // TODO: Implement real allowance check
    // Simulate checking allowance
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Randomly decide if approval is needed (for demo)
    const needsApproval = Math.random() > 0.5
    setNeedsApproval(needsApproval)

    if (needsApproval) {
      toast({
        title: "Approval Required",
        description: "You need to approve the withdrawal contract first.",
      })
    } else {
      handleWithdraw()
    }
  }

  const handleApprove = async () => {
    setApproving(true)
    try {
      // TODO: Implement real approval logic
      await new Promise((resolve) => setTimeout(resolve, 2000))

      toast({
        title: "Approval Successful",
        description: "You can now proceed with the withdrawal.",
      })

      setNeedsApproval(false)
    } catch (error) {
      console.error("[v0] Approval error:", error)
      toast({
        title: "Approval Failed",
        description: "There was an error approving the contract.",
        variant: "destructive",
      })
    } finally {
      setApproving(false)
    }
  }

  const handleWithdraw = async () => {
    if (!address || !amount) return

    setLoading(true)
    try {
      const result = await withdrawPyusdToSepolia(address, amount)

      setTxHash(result.txHash)
      setSuccess(true)

      toast({
        title: "Withdrawal Successful!",
        description: "PYUSD has been withdrawn to your Sepolia wallet.",
      })
    } catch (error) {
      console.error("[v0] Withdrawal error:", error)
      toast({
        title: "Withdrawal Failed",
        description: "There was an error processing your withdrawal.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!isConnected || !address) {
    return null
  }

  if (success && txHash) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-md">
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="font-mono">Withdrawal Complete!</CardTitle>
            <CardDescription>PYUSD has been sent to your Sepolia wallet</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground mb-1">Transaction Hash</p>
              <p className="font-mono text-sm break-all">{txHash}</p>
            </div>

            <div className="flex flex-col gap-2">
              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href="/dashboard">Back to Dashboard</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
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
          <CardTitle className="font-mono">Withdraw PYUSD</CardTitle>
          <CardDescription>Transfer PYUSD from PayVVM to your Sepolia wallet</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 rounded-lg bg-muted space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Available Balance</span>
              <span className="font-mono font-semibold">{balance} PYUSD</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Destination</span>
              <span className="font-mono text-xs">
                {address.slice(0, 6)}...{address.slice(-4)}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <div className="flex gap-2">
              <Input
                id="amount"
                type="number"
                step="0.000001"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex-1 font-mono"
              />
              <Button
                variant="outline"
                onClick={() => setAmount(balance)}
                className="bg-transparent"
                disabled={loading || approving}
              >
                Max
              </Button>
            </div>
          </div>

          {needsApproval && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You need to approve the withdrawal contract before proceeding. This is a one-time action.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            {needsApproval ? (
              <Button onClick={handleApprove} disabled={approving} className="w-full glitch-hover font-mono">
                {approving ? "Approving..." : "Approve Contract"}
              </Button>
            ) : (
              <Button
                onClick={handleCheckAllowance}
                disabled={!amount || loading || Number.parseFloat(amount) > Number.parseFloat(balance)}
                className="w-full glitch-hover font-mono"
              >
                {loading ? "Processing..." : "Withdraw"}
              </Button>
            )}

            <div className="flex items-center justify-center gap-2">
              <Badge variant="outline" className="font-mono text-xs">
                Sepolia
              </Badge>
            </div>
          </div>

          <Alert className="bg-muted/50">
            <AlertDescription className="text-xs text-muted-foreground">
              Gas sponsored by fishers when possible; otherwise wallet signs a standard transaction. Withdrawals may
              take a few minutes to confirm on Sepolia.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}
