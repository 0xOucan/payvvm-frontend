"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useWallet } from "@/contexts/wallet-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { User, LogOut, Bell } from "lucide-react"

export default function ProfilePage() {
  const { address, isConnected, disconnect } = useWallet()
  const router = useRouter()

  useEffect(() => {
    if (!isConnected) {
      router.push("/")
    }
  }, [isConnected, router])

  const handleDisconnect = () => {
    disconnect()
    router.push("/")
  }

  if (!isConnected || !address) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card className="mb-6 bg-card/50 backdrop-blur">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="font-mono">Profile</CardTitle>
              <CardDescription>Manage your PayVVM account</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-mono">Connected Wallet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Address</p>
                <p className="font-mono text-sm">{address}</p>
              </div>
              <Badge variant="outline" className="font-mono text-xs">
                Sepolia
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-mono">PayVVM Names</CardTitle>
            <CardDescription>Register a human-readable name for your address</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full bg-transparent" disabled>
              Register Name (Coming Soon)
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-mono">Notifications</CardTitle>
            <CardDescription>Manage your notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Payment notifications</span>
              </div>
              <Badge variant="outline" className="text-xs">
                Coming Soon
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-lg font-mono text-destructive">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <Separator className="mb-4" />
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-3">
                  Disconnect your wallet from PayVVM. You can reconnect anytime.
                </p>
                <Button variant="destructive" onClick={handleDisconnect} className="gap-2">
                  <LogOut className="h-4 w-4" />
                  Disconnect Wallet
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
