"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sparkles, Calendar, DollarSign, Zap } from "lucide-react"

const mockSubscriptions = [
  {
    name: "Netflix",
    logo: "🎬",
    price: "15.49",
    interval: "monthly",
    nextBilling: "2025-02-15",
    status: "active",
    color: "bg-red-500/10 border-red-500/50",
  },
  {
    name: "Spotify",
    logo: "🎵",
    price: "10.99",
    interval: "monthly",
    nextBilling: "2025-02-20",
    status: "active",
    color: "bg-green-500/10 border-green-500/50",
  },
  {
    name: "Amazon Prime",
    logo: "📦",
    price: "14.99",
    interval: "monthly",
    nextBilling: "2025-02-25",
    status: "active",
    color: "bg-blue-500/10 border-blue-500/50",
  },
  {
    name: "YouTube Premium",
    logo: "▶️",
    price: "13.99",
    interval: "monthly",
    nextBilling: "2025-02-18",
    status: "active",
    color: "bg-red-600/10 border-red-600/50",
  },
  {
    name: "Disney+",
    logo: "🏰",
    price: "10.99",
    interval: "monthly",
    nextBilling: "2025-02-22",
    status: "paused",
    color: "bg-indigo-500/10 border-indigo-500/50",
  },
  {
    name: "Apple TV+",
    logo: "🍎",
    price: "6.99",
    interval: "monthly",
    nextBilling: "2025-02-28",
    status: "active",
    color: "bg-gray-500/10 border-gray-500/50",
  },
]

export default function SubscriptionsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold font-mono flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-primary" />
              Subscriptions
            </h1>
            <p className="text-muted-foreground mt-2">
              Gasless auto-renewal subscriptions powered by PYUSD
            </p>
          </div>
          <Badge variant="outline" className="font-mono text-sm px-4 py-2 bg-primary/10 border-primary">
            COMING SOON
          </Badge>
        </div>
      </div>

      {/* Features Overview */}
      <div className="max-w-6xl mx-auto mb-8">
        <Card className="bg-card/50 backdrop-blur border-primary/30">
          <CardHeader>
            <CardTitle className="font-mono text-xl">Future Features</CardTitle>
            <CardDescription>What you'll be able to do with PayVVM Subscriptions</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Gasless Renewals</h3>
                <p className="text-sm text-muted-foreground">
                  Automatic subscription renewals without gas fees using EVVM signatures
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Flexible Schedules</h3>
                <p className="text-sm text-muted-foreground">
                  Monthly, quarterly, or annual billing with automatic PYUSD payments
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Stable Payments</h3>
                <p className="text-sm text-muted-foreground">
                  All subscriptions paid in PYUSD for predictable USD-denominated costs
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mock Subscriptions Grid */}
      <div className="max-w-6xl mx-auto">
        <h2 className="text-xl font-semibold font-mono mb-4">Your Subscriptions</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockSubscriptions.map((sub) => (
            <Card key={sub.name} className={`pixel-border ${sub.color} relative overflow-hidden`}>
              {sub.status === "paused" && (
                <div className="absolute top-2 right-2">
                  <Badge variant="secondary" className="text-xs">
                    Paused
                  </Badge>
                </div>
              )}
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-4xl">{sub.logo}</div>
                  <div>
                    <CardTitle className="font-mono text-lg">{sub.name}</CardTitle>
                    <CardDescription className="text-xs">Billed {sub.interval}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold font-mono">${sub.price}</span>
                  <span className="text-sm text-muted-foreground">/ month</span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Next billing:</span>
                    <span className="font-mono">{sub.nextBilling}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment:</span>
                    <span className="font-mono text-primary">PYUSD (Gasless)</span>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1" disabled>
                    Manage
                  </Button>
                  <Button
                    variant={sub.status === "paused" ? "default" : "ghost"}
                    size="sm"
                    className="flex-1"
                    disabled
                  >
                    {sub.status === "paused" ? "Resume" : "Pause"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Add New Subscription Card */}
        <Card className="mt-4 border-dashed border-2 border-primary/30 bg-card/30">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Add New Subscription</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
              Connect your favorite services and enable gasless auto-renewal with PYUSD
            </p>
            <Button disabled className="font-mono">
              Coming Soon
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
