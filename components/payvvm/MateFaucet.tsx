"use client"

import { useEffect } from "react"
import { useAccount } from "wagmi"
import { useMateFaucet } from "@/hooks/payvvm/useMateFaucet"
import { useMateBalance } from "@/hooks/payvvm/useMatePayment"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Droplet, CheckCircle2, XCircle, Loader2, ExternalLink } from "lucide-react"

const EVVM_ADDRESS = "0x9486f6C9d28ECdd95aba5bfa6188Bbc104d89C3e"

export const MateFaucet = () => {
  const { address, isConnected } = useAccount()
  const faucet = useMateFaucet()
  const balance = useMateBalance()

  // Refetch balance after successful claim
  useEffect(() => {
    if (faucet.isSuccess) {
      // Add delay to ensure blockchain state has propagated
      const timer = setTimeout(() => {
        balance.refetch()
      }, 500)

      // Auto-reset after 5 seconds
      const resetTimer = setTimeout(() => {
        faucet.reset()
      }, 5000)

      return () => {
        clearTimeout(timer)
        clearTimeout(resetTimer)
      }
    }
  }, [faucet.isSuccess, faucet, balance])

  const handleClaim = () => {
    try {
      faucet.claimTokens()
    } catch (error) {
      console.error("Faucet error:", error)
    }
  }

  if (!isConnected) {
    return (
      <Card className="bg-card/50 backdrop-blur border-primary/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Droplet className="h-5 w-5 text-primary" />
            <CardTitle className="font-mono text-lg">MATE Token Faucet</CardTitle>
          </div>
          <CardDescription>Claim MATE tokens with gas fees</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="border-amber-500/50 bg-amber-500/10">
            <AlertDescription className="text-sm font-mono">
              Please connect your wallet to claim MATE tokens
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card/50 backdrop-blur border-primary/50">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Droplet className="h-5 w-5 text-primary" />
            <CardTitle className="font-mono text-lg">MATE Token Faucet</CardTitle>
          </div>
          <Badge variant="outline" className="font-mono text-xs border-amber-500/50">
            Requires Gas
          </Badge>
        </div>
        <CardDescription>Random reward: 2.5 to 12,707.5 MATE tokens</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Balance */}
        <div className="p-3 rounded-lg bg-muted/50 border border-primary/20">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Your EVVM Balance</span>
            {balance.isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : (
              <span className="font-mono font-semibold">{parseFloat(balance.formatted).toFixed(4)} MATE</span>
            )}
          </div>
        </div>

        {/* Info */}
        <Alert className="border-primary/30 bg-primary/5">
          <AlertDescription className="text-xs font-mono space-y-1">
            <p className="font-bold">How it works:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Formula: 2.5 MATE × random(1-5083)</li>
              <li>Enough for username registration (500 MATE)</li>
              <li>Testnet only - claim as needed!</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* Claim Button */}
        <Button
          onClick={handleClaim}
          disabled={faucet.isPending || faucet.isConfirming}
          className="w-full glitch-hover font-mono"
        >
          {faucet.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Waiting for confirmation...
            </>
          ) : faucet.isConfirming ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Confirming transaction...
            </>
          ) : (
            <>
              <Droplet className="mr-2 h-4 w-4" />
              Claim MATE Tokens
            </>
          )}
        </Button>

        {/* Success Message */}
        {faucet.isSuccess && (
          <Alert className="border-green-500/50 bg-green-500/10">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-sm font-mono space-y-1">
              <p className="font-bold">MATE tokens claimed successfully!</p>
              <p className="text-xs">Your balance will update automatically in ~1 second</p>
              {faucet.hash && (
                <a
                  href={`https://sepolia.etherscan.io/tx/${faucet.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline text-xs mt-1"
                >
                  View transaction <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Error Message */}
        {faucet.error && (
          <Alert className="border-red-500/50 bg-red-500/10">
            <XCircle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-sm font-mono">
              <p className="font-bold">Claim failed</p>
              <p className="text-xs">{faucet.error.message}</p>
            </AlertDescription>
          </Alert>
        )}

        {/* Contract Info */}
        <div className="pt-2 border-t border-primary/20">
          <p className="text-xs text-muted-foreground font-mono">
            EVVM:{" "}
            <a
              href={`https://sepolia.etherscan.io/address/${EVVM_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {EVVM_ADDRESS.slice(0, 6)}...{EVVM_ADDRESS.slice(-4)}
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
