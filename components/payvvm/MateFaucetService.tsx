"use client"

import { useState, useEffect } from "react"
import { useAccount } from "wagmi"
import { useMateFaucetService } from "@/hooks/payvvm/useMateFaucetService"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Droplet, CheckCircle2, XCircle, Loader2, Clock, ExternalLink } from "lucide-react"

export const MateFaucetService = () => {
  const { isConnected } = useAccount()
  const faucet = useMateFaucetService()
  const [claiming, setClaiming] = useState(false)

  // Auto-submit to fishing pool after signature is obtained
  useEffect(() => {
    if (faucet.signature && !claiming) {
      setClaiming(true)
      // Submit to fishing pool for fishers to execute
      faucet
        .submitToFishers()
        .then(() => {
          console.log("✅ MATE faucet claim submitted to fishing pool - fishers will execute it")
          // Refresh balances after successful submission
          setTimeout(() => {
            faucet.refetchEligibility()
            faucet.refetchFaucetBalance()
            faucet.refetchUserBalance()
            setClaiming(false)
            faucet.reset()
          }, 3000)
        })
        .catch((error) => {
          console.error("Failed to submit claim to fishing pool:", error)
          setClaiming(false)
        })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faucet.signature])

  const handleClaim = async () => {
    try {
      await faucet.initiateClaim()
    } catch (error: any) {
      alert(error.message || "Failed to initiate claim")
      console.error("Claim error:", error)
    }
  }

  // Format time remaining
  const formatTimeRemaining = (seconds: bigint): string => {
    const totalSeconds = Number(seconds)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const secs = totalSeconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    }
    return `${secs}s`
  }

  if (!isConnected) {
    return (
      <Card className="bg-card/50 backdrop-blur border-primary/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Droplet className="h-5 w-5 text-primary" />
            <CardTitle className="font-mono text-lg">MATE Faucet Service (510 MATE)</CardTitle>
          </div>
          <CardDescription>Gasless MATE token claims</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="border-amber-500/50 bg-amber-500/10">
            <AlertDescription className="text-sm font-mono">Please connect your wallet to claim MATE</AlertDescription>
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
            <CardTitle className="font-mono text-lg">MATE Faucet Service</CardTitle>
          </div>
          <Badge variant="outline" className="font-mono text-xs border-primary/50">
            Gasless
          </Badge>
        </div>
        <CardDescription>Claim 510 MATE tokens via gasless signature</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Faucet Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2 rounded-lg bg-muted/50 border border-primary/20">
            <p className="text-xs text-muted-foreground">Faucet Balance</p>
            <p className="font-mono font-semibold text-sm">
              {faucet.isLoadingFaucetBalance ? (
                <Loader2 className="h-3 w-3 animate-spin text-primary" />
              ) : (
                `${(Number(faucet.faucetBalance) / 1e18).toFixed(2)}`
              )}
            </p>
          </div>

          <div className="p-2 rounded-lg bg-muted/50 border border-primary/20">
            <p className="text-xs text-muted-foreground">Claim Amount</p>
            <p className="font-mono font-semibold text-sm">
              {faucet.isLoadingClaimAmount ? (
                <Loader2 className="h-3 w-3 animate-spin text-primary" />
              ) : (
                `${(Number(faucet.claimAmount) / 1e18).toFixed(2)}`
              )}
            </p>
          </div>

          <div className="p-2 rounded-lg bg-muted/50 border border-primary/20">
            <p className="text-xs text-muted-foreground">Your Balance</p>
            <p className="font-mono font-semibold text-sm">{`${(Number(faucet.userMateBalance) / 1e18).toFixed(2)}`}</p>
          </div>
        </div>

        {/* Eligibility Status */}
        {faucet.isCheckingEligibility ? (
          <Alert className="border-primary/30 bg-primary/5">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <AlertDescription className="text-sm font-mono">Checking eligibility...</AlertDescription>
          </Alert>
        ) : faucet.canClaim ? (
          <Alert className="border-green-500/50 bg-green-500/10">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-sm font-mono font-bold">✅ You can claim MATE now!</AlertDescription>
          </Alert>
        ) : (
          <Alert className="border-amber-500/50 bg-amber-500/10">
            <Clock className="h-4 w-4 text-amber-500" />
            <AlertDescription className="text-sm font-mono">
              <p className="font-bold">⏳ Cooldown active</p>
              <p className="text-xs">Next claim: {formatTimeRemaining(faucet.remainingCooldown)}</p>
              <p className="text-xs">Cooldown: {Number(faucet.cooldownPeriod) / 3600}h</p>
            </AlertDescription>
          </Alert>
        )}

        {/* Claim Button */}
        <Button
          onClick={handleClaim}
          disabled={
            !faucet.canClaim ||
            faucet.isSigning ||
            claiming ||
            faucet.isLoadingMetadata ||
            !faucet.evvmId ||
            Number(faucet.faucetBalance) < Number(faucet.claimAmount)
          }
          className="w-full glitch-hover font-mono"
        >
          {faucet.isLoadingMetadata ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading EVVM Data...
            </>
          ) : Number(faucet.faucetBalance) < Number(faucet.claimAmount) ? (
            "Faucet Empty"
          ) : faucet.isSigning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sign Claim...
            </>
          ) : claiming ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting to Fishers...
            </>
          ) : !faucet.canClaim ? (
            <>Wait {formatTimeRemaining(faucet.remainingCooldown)}</>
          ) : (
            "Claim MATE"
          )}
        </Button>

        {/* Transaction Status */}
        {faucet.signature && !claiming && (
          <Alert className="border-green-500/50 bg-green-500/10">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-sm font-mono">
              Claim submitted to fishing pool! Fishers will execute it shortly.
            </AlertDescription>
          </Alert>
        )}

        {faucet.signError && (
          <Alert className="border-red-500/50 bg-red-500/10">
            <XCircle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-sm font-mono">
              <p className="font-bold">Claim failed</p>
              <p className="text-xs">{faucet.signError?.message}</p>
            </AlertDescription>
          </Alert>
        )}

        {/* How it Works */}
        <Alert className="border-primary/30 bg-primary/5">
          <AlertDescription className="text-xs font-mono space-y-1">
            <p className="font-bold">How the MATE faucet works:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Sign claim message with your wallet (EIP-191)</li>
              <li>Submit signed claim to fishing pool</li>
              <li>Fisher executes your claim and pays gas</li>
              <li>Receive {(Number(faucet.claimAmount) / 1e18).toFixed(2)} MATE in your EVVM balance</li>
              <li>Wait {Number(faucet.cooldownPeriod) / 3600} hours before next claim</li>
            </ol>
          </AlertDescription>
        </Alert>

        {/* Contract Info */}
        <div className="pt-2 border-t border-primary/20">
          <p className="text-xs text-muted-foreground font-mono">
            Faucet:{" "}
            <a
              href="https://sepolia.etherscan.io/address/0x068E9091e430786133439258C4BeeD696939405e"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              0x068E...405e
            </a>
          </p>
          <p className="text-xs text-muted-foreground font-mono">EVVM ID: {faucet.evvmId?.toString() || "Loading..."}</p>
        </div>
      </CardContent>
    </Card>
  )
}
