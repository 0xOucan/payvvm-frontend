"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useWallet } from "@/contexts/wallet-context"
import { InvoiceQR } from "@/components/invoice-qr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Copy, Check } from "lucide-react"
import Link from "next/link"
import { createInvoice } from "@/services/evvm"
import { useToast } from "@/hooks/use-toast"

export default function InvoicePage() {
  const { address, isConnected } = useWallet()
  const router = useRouter()
  const { toast } = useToast()

  const [amount, setAmount] = useState("")
  const [memo, setMemo] = useState("")
  const [showQR, setShowQR] = useState(false)
  const [invoiceId, setInvoiceId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!isConnected) {
      router.push("/")
    }
  }, [isConnected, router])

  const handleGenerate = async () => {
    if (!amount || !address) return

    try {
      const invoice = await createInvoice(amount, memo)
      setInvoiceId(invoice.invoiceId)
      setShowQR(true)

      toast({
        title: "Invoice Created",
        description: "QR code generated successfully",
      })
    } catch (error) {
      console.error("[v0] Invoice creation error:", error)
      toast({
        title: "Error",
        description: "Failed to create invoice",
        variant: "destructive",
      })
    }
  }

  const handleCopyLink = () => {
    if (!address) return

    const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
    const link = `${baseUrl}/send?to=${address}&amount=${amount}${memo ? `&memo=${encodeURIComponent(memo)}` : ""}`

    navigator.clipboard.writeText(link)
    setCopied(true)

    toast({
      title: "Link Copied",
      description: "Invoice link copied to clipboard",
    })

    setTimeout(() => setCopied(false), 2000)
  }

  const handleReset = () => {
    setShowQR(false)
    setInvoiceId(null)
    setAmount("")
    setMemo("")
  }

  if (!isConnected || !address) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <Button asChild variant="ghost" size="sm" className="gap-2">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      {!showQR ? (
        <Card className="bg-card/50 backdrop-blur border-primary/50">
          <CardHeader>
            <CardTitle className="font-mono">Create Invoice (PYUSD)</CardTitle>
            <CardDescription>Generate a QR code for customers to scan and pay gaslessly</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (PYUSD)</Label>
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

            <div className="space-y-2">
              <Label htmlFor="memo">Memo (Optional)</Label>
              <Textarea
                id="memo"
                placeholder="Payment for..."
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                rows={3}
              />
            </div>

            <Button onClick={handleGenerate} disabled={!amount} className="w-full glitch-hover font-mono">
              Generate QR Code
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="bg-card/50 backdrop-blur border-primary/50">
            <CardHeader>
              <CardTitle className="font-mono">Invoice QR Code</CardTitle>
              <CardDescription>Customer scans this QR to auto-fill the send form</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-center">
                <InvoiceQR amount={amount} memo={memo} address={address} />
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Amount</span>
                    <span className="font-mono font-semibold">{amount} PYUSD</span>
                  </div>
                  {memo && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Memo</span>
                      <span className="text-sm">{memo}</span>
                    </div>
                  )}
                  {invoiceId && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Invoice ID</span>
                      <span className="text-xs font-mono">{invoiceId}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleCopyLink} variant="outline" className="flex-1 gap-2 bg-transparent border-primary/50 hover:bg-primary/5">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Copied!" : "Copy Link"}
                  </Button>
                  <Button onClick={handleReset} variant="outline" className="flex-1 bg-transparent border-primary/50 hover:bg-primary/5">
                    Create New
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/30">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground text-pretty font-mono">
                <strong>Instructions:</strong> Customer scans QR to auto-fill the Send form with your address and
                amount, then signs gaslessly with EVVM EIP-191.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
