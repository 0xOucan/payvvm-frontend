"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useWallet } from "@/contexts/wallet-context"
import { SendForm } from "@/components/send-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, ExternalLink } from "lucide-react"
import Link from "next/link"
import { createPaymentIntent, submitSignedPayment, resolveName } from "@/services/evvm"
import { useToast } from "@/hooks/use-toast"

export default function SendPage() {
  const { address, isConnected } = useWallet()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [txId, setTxId] = useState<string | null>(null)

  // Pre-fill from query params (for invoice deep links)
  const [prefillRecipient] = useState(searchParams.get("to") || "")
  const [prefillAmount] = useState(searchParams.get("amount") || "")

  useEffect(() => {
    if (!isConnected) {
      router.push("/")
    }
  }, [isConnected, router])

  const handleSubmit = async (data: { recipient: string; amount: string; asyncNonce: boolean }) => {
    setLoading(true)

    try {
      // Step 1: Resolve name if needed
      const resolvedAddress = await resolveName(data.recipient)

      // Step 2: Create payment intent
      const intent = await createPaymentIntent({
        to: resolvedAddress,
        amount: data.amount,
        token: "PYUSD",
      })

      // Step 3: Request EIP-191 signature (mock)
      // TODO: Implement real wallet signature request
      const mockMessage = `PayVVM Payment\nTo: ${resolvedAddress}\nAmount: ${data.amount} PYUSD\nIntent: ${intent.intentId}`
      const mockSignature = "0x" + "a".repeat(130) // Mock signature

      toast({
        title: "Signature Requested",
        description: "Please sign the message in your wallet (simulated)",
      })

      // Simulate user signing
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Step 4: Submit signed payment
      const result = await submitSignedPayment(mockMessage, mockSignature)

      setTxId(result.txId)
      setSuccess(true)

      toast({
        title: "Payment Sent!",
        description: "Your gasless payment has been submitted successfully.",
      })
    } catch (error) {
      console.error("[v0] Send error:", error)
      toast({
        title: "Payment Failed",
        description: "There was an error processing your payment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!isConnected) {
    return null
  }

  if (success && txId) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-md">
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="font-mono">Payment Sent!</CardTitle>
            <CardDescription>Your gasless PYUSD payment has been submitted</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground mb-1">Transaction ID</p>
              <p className="font-mono text-sm break-all">{txId}</p>
            </div>

            <div className="flex flex-col gap-2">
              <Button asChild className="w-full">
                <Link href={`/explorer?tx=${txId}`}>
                  View in Explorer
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
              </Button>

              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href="/send">Send Another</Link>
              </Button>

              <Button asChild variant="ghost" className="w-full">
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
      <Card>
        <CardHeader>
          <CardTitle className="font-mono">Send PYUSD (Gasless)</CardTitle>
          <CardDescription>Sign with EIP-191, fishers execute the transaction</CardDescription>
        </CardHeader>
        <CardContent>
          <SendForm onSubmit={handleSubmit} loading={loading} />
        </CardContent>
      </Card>

      <div className="mt-6 text-center">
        <p className="text-xs text-muted-foreground">
          Gasless transactions are powered by EVVM. No ETH required for gas fees.
        </p>
      </div>
    </div>
  )
}
