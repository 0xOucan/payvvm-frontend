"use client"

/**
 * Send Page - PYUSD Payment Interface
 *
 * Allows users to send gasless PYUSD payments using EVVM
 * Supports QR code scanning and URL parameters for auto-fill
 */

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useWallet } from "@/contexts/wallet-context"
import { PyusdPayment } from "@/components/payvvm/PyusdPayment"
import { QRScanner } from "@/components/qr-scanner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { QrCode } from "lucide-react"

export default function SendPage() {
  const { isConnected } = useWallet()
  const router = useRouter()
  const searchParams = useSearchParams()

  // State for payment form values
  const [recipient, setRecipient] = useState("")
  const [amount, setAmount] = useState("")
  const [memo, setMemo] = useState("")

  // State for QR scanner modal
  const [showScanner, setShowScanner] = useState(false)

  // Read URL parameters on mount
  useEffect(() => {
    const toParam = searchParams.get("to")
    const amountParam = searchParams.get("amount")
    const memoParam = searchParams.get("memo")

    if (toParam) setRecipient(toParam)
    if (amountParam) setAmount(amountParam)
    if (memoParam) setMemo(memoParam)
  }, [searchParams])

  // Redirect to home if not connected
  useEffect(() => {
    if (!isConnected) {
      router.push("/")
    }
  }, [isConnected, router])

  // Handle QR code scan
  const handleQRScan = (data: { to: string; amount: string; memo?: string }) => {
    setRecipient(data.to)
    setAmount(data.amount)
    if (data.memo) setMemo(data.memo)
  }

  if (!isConnected) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <Card className="bg-card/50 backdrop-blur border-primary/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-mono">Send PYUSD (Gasless)</CardTitle>
              <CardDescription className="text-muted-foreground">
                Sign with EIP-191, fishers execute the transaction
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowScanner(true)}
              className="shrink-0"
              title="Scan QR Code"
            >
              <QrCode className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <PyusdPayment
            initialRecipient={recipient}
            initialAmount={amount}
            initialMemo={memo}
          />
        </CardContent>
      </Card>

      <div className="mt-6 text-center">
        <p className="text-xs text-muted-foreground font-mono">
          Gasless transactions are powered by EVVM. No ETH required for gas fees.
        </p>
      </div>

      {/* QR Scanner Modal */}
      {showScanner && (
        <QRScanner
          onScan={handleQRScan}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  )
}
