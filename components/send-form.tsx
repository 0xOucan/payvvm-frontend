"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { QRScanner } from "./qr-scanner"
import { QrCode, Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface SendFormProps {
  onSubmit: (data: { recipient: string; amount: string; asyncNonce: boolean }) => void
  loading?: boolean
}

export function SendForm({ onSubmit, loading }: SendFormProps) {
  const [recipient, setRecipient] = useState("")
  const [amount, setAmount] = useState("")
  const [asyncNonce, setAsyncNonce] = useState(false)
  const [showScanner, setShowScanner] = useState(false)

  const handleScan = (data: string) => {
    setRecipient(data)
    setShowScanner(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ recipient, amount, asyncNonce })
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Token Selector (Fixed to PYUSD) */}
        <div className="space-y-2">
          <Label htmlFor="token">Token</Label>
          <div className="flex items-center gap-2">
            <Input id="token" value="PYUSD" disabled className="flex-1" />
            <Badge variant="outline" className="font-mono text-xs">
              6 decimals
            </Badge>
          </div>
        </div>

        {/* Recipient */}
        <div className="space-y-2">
          <Label htmlFor="recipient">Recipient</Label>
          <div className="flex gap-2">
            <Input
              id="recipient"
              placeholder="0x... or name.eth"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              required
              className="flex-1"
            />
            <Button type="button" variant="outline" size="icon" onClick={() => setShowScanner(true)}>
              <QrCode className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Amount */}
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            type="number"
            step="0.000001"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            className="font-mono"
          />
        </div>

        {/* Advanced: Async Nonce */}
        <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/50">
          <div className="flex items-center gap-2">
            <Label htmlFor="async-nonce" className="cursor-pointer">
              Async Nonce
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-xs">
                    Enable async nonce for parallel transaction submission. Useful for high-frequency payments.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Switch id="async-nonce" checked={asyncNonce} onCheckedChange={setAsyncNonce} />
        </div>

        {/* Submit Button */}
        <div className="space-y-3">
          <Button type="submit" className="w-full glitch-hover font-mono" disabled={loading}>
            {loading ? "Processing..." : "Send (Gasless)"}
          </Button>

          <div className="flex items-center justify-center gap-2">
            <Badge variant="outline" className="font-mono text-xs">
              Gasless
            </Badge>
            <Badge variant="outline" className="font-mono text-xs">
              EVVM EIP-191
            </Badge>
          </div>
        </div>
      </form>

      {showScanner && <QRScanner onScan={handleScan} onClose={() => setShowScanner(false)} />}
    </>
  )
}
