"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/data-table"
import { TransactionDrawer } from "@/components/transaction-drawer"
import { Search, Activity } from "lucide-react"
import { getExplorerFeed } from "@/services/evvm"
import type { Transaction } from "@/lib/mock"

export default function ExplorerPage() {
  const searchParams = useSearchParams()
  const txParam = searchParams.get("tx")

  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("payments")
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getExplorerFeed({ limit: 20 })
        setTransactions(data)

        // If tx param exists, find and open it
        if (txParam) {
          const tx = data.find((t) => t.id === txParam)
          if (tx) {
            setSelectedTx(tx)
            setDrawerOpen(true)
          }
        }
      } catch (error) {
        console.error("[v0] Failed to load explorer data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [txParam])

  const handleRowClick = (tx: Transaction) => {
    setSelectedTx(tx)
    setDrawerOpen(true)
  }

  const filteredTransactions = transactions.filter((tx) => {
    if (!searchQuery) return activeTab === "all" || tx.type === activeTab.slice(0, -1)

    const query = searchQuery.toLowerCase()
    return (
      (activeTab === "all" || tx.type === activeTab.slice(0, -1)) &&
      (tx.id.toLowerCase().includes(query) ||
        tx.counterparty.toLowerCase().includes(query) ||
        tx.token.toLowerCase().includes(query))
    )
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="mb-8 bg-card/50 backdrop-blur">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-mono text-2xl">PayVVM Scan</CardTitle>
              <CardDescription>Explorer for EVVM-powered payments</CardDescription>
            </div>
            <Badge variant="outline" className="gap-2 font-mono">
              <Activity className="h-3 w-3 animate-pulse text-primary" />
              HyperSync Connected
            </Badge>
          </div>
        </CardHeader>
      </Card>

      <div className="space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by address, name, or transaction ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all" className="font-mono text-xs">
              All
            </TabsTrigger>
            <TabsTrigger value="payments" className="font-mono text-xs">
              Payments
            </TabsTrigger>
            <TabsTrigger value="invoices" className="font-mono text-xs">
              Invoices
            </TabsTrigger>
            <TabsTrigger value="dispersals" className="font-mono text-xs">
              Dispersals
            </TabsTrigger>
            <TabsTrigger value="accounts" className="font-mono text-xs">
              Accounts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground font-mono">Loading transactions...</p>
              </div>
            ) : (
              <DataTable data={filteredTransactions} onRowClick={handleRowClick} />
            )}
          </TabsContent>

          <TabsContent value="payments" className="mt-6">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground font-mono">Loading payments...</p>
              </div>
            ) : (
              <DataTable data={filteredTransactions} onRowClick={handleRowClick} />
            )}
          </TabsContent>

          <TabsContent value="invoices" className="mt-6">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground font-mono">Loading invoices...</p>
              </div>
            ) : (
              <DataTable data={filteredTransactions} onRowClick={handleRowClick} />
            )}
          </TabsContent>

          <TabsContent value="dispersals" className="mt-6">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground font-mono">Loading dispersals...</p>
              </div>
            ) : (
              <DataTable data={filteredTransactions} onRowClick={handleRowClick} />
            )}
          </TabsContent>

          <TabsContent value="accounts" className="mt-6">
            <div className="text-center py-12">
              <p className="text-muted-foreground">Account explorer coming soon</p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Pagination Placeholder */}
        {!loading && filteredTransactions.length > 0 && (
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" disabled className="bg-transparent">
              Previous
            </Button>
            <span className="text-sm text-muted-foreground font-mono">Page 1 of 1</span>
            <Button variant="outline" size="sm" disabled className="bg-transparent">
              Next
            </Button>
          </div>
        )}
      </div>

      <TransactionDrawer transaction={selectedTx} open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  )
}
