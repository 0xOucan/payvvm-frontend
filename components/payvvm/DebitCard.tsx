"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface DebitCardProps {
  label: string
  address: string
  balance: string
  symbol: string
}

export function DebitCard({ label, address, balance, symbol }: DebitCardProps) {
  const [cardNumber, setCardNumber] = useState("")

  useEffect(() => {
    // Generate randomized 16-digit card number on mount
    const generateCardNumber = () => {
      const parts = []
      for (let i = 0; i < 4; i++) {
        parts.push(Math.floor(1000 + Math.random() * 9000).toString())
      }
      return parts.join(" ")
    }
    setCardNumber(generateCardNumber())
  }, [])

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 border-primary/50 pixel-border">
      <CardContent className="p-6 md:p-8">
        <div className="space-y-6">
          {/* Card Header */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
              <p className="text-sm font-mono text-muted-foreground mt-1">
                {address.slice(0, 6)}...{address.slice(-4)}
              </p>
            </div>
            <Badge variant="outline" className="font-mono text-xs bg-background/50">
              {symbol}
            </Badge>
          </div>

          {/* Balance */}
          <div>
            <p className="text-4xl md:text-5xl font-bold font-mono tracking-tight">${balance}</p>
            <p className="text-xs text-muted-foreground mt-2">EVVM internal balance · signature-based transfers</p>
          </div>

          {/* Card Number */}
          <div>
            <p className="text-sm font-mono tracking-wider">{cardNumber || "•••• •••• •••• ••••"}</p>
          </div>

          {/* Data Source */}
          <div className="pt-2 border-t border-primary/20">
            <p className="text-xs text-muted-foreground">Data: Envio HyperSync</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
