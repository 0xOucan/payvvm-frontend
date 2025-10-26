"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Droplet } from "lucide-react"

interface FaucetCardProps {
  title: string
  description: string
  token: string
  amount: string
  gasless: boolean
  cooldownMinutes: number
  onClaim: () => Promise<void>
}

export function FaucetCard({ title, description, token, amount, gasless, cooldownMinutes, onClaim }: FaucetCardProps) {
  const [claiming, setClaiming] = useState(false)
  const [lastClaim, setLastClaim] = useState<number | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<number>(0)

  useEffect(() => {
    // Check localStorage for last claim time
    const storageKey = `faucet-${token.toLowerCase()}-${gasless ? "gasless" : "gas"}`
    const stored = localStorage.getItem(storageKey)
    if (stored) {
      setLastClaim(Number.parseInt(stored))
    }
  }, [token, gasless])

  useEffect(() => {
    if (!lastClaim) return

    const interval = setInterval(() => {
      const now = Date.now()
      const elapsed = now - lastClaim
      const cooldownMs = cooldownMinutes * 60 * 1000
      const remaining = Math.max(0, cooldownMs - elapsed)

      setTimeRemaining(remaining)

      if (remaining === 0) {
        clearInterval(interval)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [lastClaim, cooldownMinutes])

  const handleClaim = async () => {
    setClaiming(true)
    try {
      await onClaim()
      const now = Date.now()
      setLastClaim(now)

      const storageKey = `faucet-${token.toLowerCase()}-${gasless ? "gasless" : "gas"}`
      localStorage.setItem(storageKey, now.toString())
    } catch (error) {
      console.error("[v0] Faucet claim error:", error)
    } finally {
      setClaiming(false)
    }
  }

  const canClaim = timeRemaining === 0
  const minutesRemaining = Math.ceil(timeRemaining / 60000)

  return (
    <Card className="bg-card/50 backdrop-blur">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Droplet className="h-5 w-5 text-primary" />
            <CardTitle className="font-mono text-lg">{title}</CardTitle>
          </div>
          {gasless && (
            <Badge variant="outline" className="font-mono text-xs">
              Gasless
            </Badge>
          )}
        </div>
        <CardDescription className="text-pretty">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 rounded-lg bg-muted space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Token</span>
            <span className="font-mono font-semibold">{token}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Amount</span>
            <span className="font-mono font-semibold">{amount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Cooldown</span>
            <span className="text-sm">{cooldownMinutes} min</span>
          </div>
        </div>

        {!canClaim && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Available in {minutesRemaining} minute{minutesRemaining !== 1 ? "s" : ""}
            </span>
          </div>
        )}

        <Button onClick={handleClaim} disabled={!canClaim || claiming} className="w-full glitch-hover font-mono">
          {claiming ? "Claiming..." : canClaim ? "Claim" : "On Cooldown"}
        </Button>

        {!gasless && <p className="text-xs text-muted-foreground text-center">Requires ETH for gas fees</p>}
      </CardContent>
    </Card>
  )
}
