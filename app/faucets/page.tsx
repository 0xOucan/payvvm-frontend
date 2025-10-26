"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useWallet } from "@/contexts/wallet-context"
import { FaucetCard } from "@/components/faucet-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

export default function FaucetsPage() {
  const { isConnected } = useWallet()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (!isConnected) {
      router.push("/")
    }
  }, [isConnected, router])

  const handleClaim = async (faucetName: string) => {
    // TODO: Implement real faucet claim logic
    await new Promise((resolve) => setTimeout(resolve, 1500))

    toast({
      title: "Claim Successful!",
      description: `${faucetName} tokens have been added to your balance.`,
    })
  }

  if (!isConnected) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="mb-8 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="font-mono text-2xl">Test Faucets</CardTitle>
          <CardDescription>Claim test tokens for PayVVM development and testing</CardDescription>
        </CardHeader>
      </Card>

      <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        <FaucetCard
          title="MATE Faucet"
          description="Claim MATE tokens without ETH. Gasless via EVVM."
          token="MATE"
          amount="100.00"
          gasless={true}
          cooldownMinutes={60}
          onClaim={() => handleClaim("MATE (Gasless)")}
        />

        <FaucetCard
          title="MATE Faucet (Gas)"
          description="Claim MATE tokens with standard gas fees. Same payout."
          token="MATE"
          amount="100.00"
          gasless={false}
          cooldownMinutes={60}
          onClaim={() => handleClaim("MATE (Gas)")}
        />

        <FaucetCard
          title="PYUSD Faucet"
          description="Claim test PYUSD for PayVVM internal balance. Gasless."
          token="PYUSD"
          amount="50.00"
          gasless={true}
          cooldownMinutes={120}
          onClaim={() => handleClaim("PYUSD")}
        />
      </div>

      <Card className="mt-8 max-w-6xl mx-auto bg-muted/50">
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground text-pretty">
            <strong>Note:</strong> These are test faucets for development purposes only. Tokens have no real value and
            are used for testing PayVVM functionality on Sepolia testnet.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
