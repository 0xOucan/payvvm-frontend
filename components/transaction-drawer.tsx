"use client"

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { Transaction } from "@/lib/mock"

interface TransactionDrawerProps {
  transaction: Transaction | null
  open: boolean
  onClose: () => void
}

export function TransactionDrawer({ transaction, open, onClose }: TransactionDrawerProps) {
  if (!transaction) return null

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-mono">Transaction Details</SheetTitle>
          <SheetDescription>EVVM state and signatures</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Transaction ID</span>
              <Badge variant="outline" className="font-mono text-xs">
                {transaction.id}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Type</span>
              <Badge variant="outline" className="font-mono text-xs capitalize">
                {transaction.type}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge className="font-mono text-xs bg-primary/10 text-primary border-primary/50">Confirmed</Badge>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Payment Details</h4>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Token</span>
                <span className="text-sm font-mono">{transaction.token}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Amount</span>
                <span className="text-sm font-mono font-semibold">{transaction.amount}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Counterparty</span>
                <span className="text-sm font-mono">{transaction.counterparty}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Time</span>
                <span className="text-sm">{transaction.time} ago</span>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="text-sm font-semibold">EVVM Data</h4>

            <div className="p-3 rounded-lg bg-muted space-y-2">
              <div>
                <p className="text-xs text-muted-foreground mb-1">EIP-191 Message</p>
                <p className="text-xs font-mono break-all">0x{Math.random().toString(16).slice(2, 66)}...</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Signature</p>
                <p className="text-xs font-mono break-all">0x{Math.random().toString(16).slice(2, 66)}...</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Fisher</p>
                <p className="text-xs font-mono">0x{Math.random().toString(16).slice(2, 42)}</p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="text-sm font-semibold">HyperSync Metadata</h4>
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground">
                Indexed by Envio HyperSync from EVVM smart contract events
              </p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
