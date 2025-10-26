"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, Wallet, Sparkles, ArrowUpCircle, ArrowDownCircle } from "lucide-react"

const mockAssets = [
  {
    name: "PYUSD",
    symbol: "PYUSD",
    logo: "💵",
    supplyAPY: "8.42",
    borrowAPY: "12.15",
    totalSupply: "2,450,000",
    totalBorrow: "1,820,000",
    yourSupply: "0",
    yourBorrow: "0",
    color: "bg-green-500/10 border-green-500/50",
  },
  {
    name: "Wrapped Bitcoin",
    symbol: "WBTC",
    logo: "₿",
    supplyAPY: "3.82",
    borrowAPY: "6.25",
    totalSupply: "125",
    totalBorrow: "78",
    yourSupply: "0",
    yourBorrow: "0",
    color: "bg-orange-500/10 border-orange-500/50",
  },
  {
    name: "Wrapped Ether",
    symbol: "WETH",
    logo: "Ξ",
    supplyAPY: "4.15",
    borrowAPY: "7.30",
    totalSupply: "18,500",
    totalBorrow: "12,200",
    yourSupply: "0",
    yourBorrow: "0",
    color: "bg-blue-500/10 border-blue-500/50",
  },
]

export default function LendingPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold font-mono flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-primary" />
              PayVVM Lending
            </h1>
            <p className="text-muted-foreground mt-2">Supply assets, earn yield, and borrow against collateral</p>
          </div>
          <Badge variant="outline" className="font-mono text-sm px-4 py-2 bg-primary/10 border-primary">
            COMING SOON
          </Badge>
        </div>
      </div>

      {/* Portfolio Summary */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="pixel-border bg-card/50 backdrop-blur">
            <CardHeader className="pb-3">
              <CardDescription>Total Supply</CardDescription>
              <CardTitle className="text-3xl font-mono">$0.00</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">No assets supplied yet</p>
            </CardContent>
          </Card>

          <Card className="pixel-border bg-card/50 backdrop-blur">
            <CardHeader className="pb-3">
              <CardDescription>Total Borrow</CardDescription>
              <CardTitle className="text-3xl font-mono">$0.00</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">No active borrows</p>
            </CardContent>
          </Card>

          <Card className="pixel-border bg-card/50 backdrop-blur">
            <CardHeader className="pb-3">
              <CardDescription>Net APY</CardDescription>
              <CardTitle className="text-3xl font-mono text-primary">0.00%</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Weighted average yield</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Markets */}
      <div className="max-w-6xl mx-auto">
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="font-mono text-xl">Markets</CardTitle>
            <CardDescription>Supply and borrow crypto assets with competitive rates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockAssets.map((asset) => (
                <Card key={asset.symbol} className={`${asset.color} pixel-border`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="text-4xl">{asset.logo}</div>
                        <div>
                          <h3 className="font-semibold text-lg">{asset.name}</h3>
                          <p className="text-sm text-muted-foreground font-mono">{asset.symbol}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="font-mono">
                          Gasless via EVVM
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Supply APY</p>
                        <p className="text-2xl font-bold font-mono text-primary">{asset.supplyAPY}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Borrow APY</p>
                        <p className="text-2xl font-bold font-mono text-destructive">{asset.borrowAPY}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Total Supply</p>
                        <p className="text-lg font-semibold font-mono">
                          {asset.totalSupply} {asset.symbol}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Total Borrow</p>
                        <p className="text-lg font-semibold font-mono">
                          {asset.totalBorrow} {asset.symbol}
                        </p>
                      </div>
                    </div>

                    <Tabs defaultValue="supply" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="supply">Supply</TabsTrigger>
                        <TabsTrigger value="borrow">Borrow</TabsTrigger>
                      </TabsList>
                      <TabsContent value="supply" className="space-y-4 pt-4">
                        <div className="flex gap-2">
                          <Input
                            placeholder={`0.00 ${asset.symbol}`}
                            className="flex-1 font-mono"
                            disabled
                          />
                          <Button className="font-mono" disabled>
                            <ArrowUpCircle className="h-4 w-4 mr-2" />
                            Supply
                          </Button>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Your supply:</span>
                          <span className="font-mono font-semibold">
                            {asset.yourSupply} {asset.symbol}
                          </span>
                        </div>
                      </TabsContent>
                      <TabsContent value="borrow" className="space-y-4 pt-4">
                        <div className="flex gap-2">
                          <Input
                            placeholder={`0.00 ${asset.symbol}`}
                            className="flex-1 font-mono"
                            disabled
                          />
                          <Button variant="destructive" className="font-mono" disabled>
                            <ArrowDownCircle className="h-4 w-4 mr-2" />
                            Borrow
                          </Button>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Your borrow:</span>
                          <span className="font-mono font-semibold">
                            {asset.yourBorrow} {asset.symbol}
                          </span>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mt-6 border-dashed border-2 border-primary/30 bg-card/30">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">How PayVVM Lending Works</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    • <strong>Supply:</strong> Deposit PYUSD, WBTC, or WETH to earn interest. Withdraw anytime with
                    gasless transactions
                  </p>
                  <p>
                    • <strong>Borrow:</strong> Use your supplied assets as collateral to borrow other assets. Interest
                    accrues over time
                  </p>
                  <p>
                    • <strong>Gasless:</strong> All supply, borrow, and repay transactions use EVVM for gasless
                    execution via EIP-191 signatures
                  </p>
                  <p>
                    • <strong>Competitive Rates:</strong> Dynamic interest rates based on utilization. Higher demand =
                    higher APY for suppliers
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
