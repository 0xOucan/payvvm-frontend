"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, Download, Users, DollarSign, FileText, Zap, Info } from "lucide-react"

const mockPayrollData = [
  { address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb", amount: "1250.00", name: "Alice Johnson" },
  { address: "0x8b3f2C4d5E6A7f8e9C1b2A3D4e5F6c7D8e9F0A1B", amount: "1500.00", name: "Bob Smith" },
  { address: "0x3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f", amount: "1000.00", name: "Carol Davis" },
  { address: "0x9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b", amount: "1750.00", name: "David Wilson" },
  { address: "0x5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f", amount: "1350.00", name: "Eve Martinez" },
]

export default function PayrollPage() {
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCsvFile(e.target.files[0])
      setShowPreview(true)
    }
  }

  const totalAmount = mockPayrollData.reduce((sum, item) => sum + parseFloat(item.amount), 0).toFixed(2)

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold font-mono flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              Payroll Distribution
            </h1>
            <p className="text-muted-foreground mt-2">
              Gasless PYUSD payroll distribution using EVVM dispersePay
            </p>
          </div>
          <Badge variant="outline" className="font-mono text-sm px-4 py-2 bg-primary/10 border-primary">
            BETA
          </Badge>
        </div>
      </div>

      {/* Info Alert */}
      <div className="max-w-6xl mx-auto mb-6">
        <Alert className="border-primary/30 bg-primary/5">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>How it works:</strong> Upload a CSV file with recipient addresses and amounts. PayVVM will use
            EVVM's <code className="text-xs bg-muted px-1 py-0.5 rounded">dispersePay</code> function to distribute
            PYUSD to multiple recipients in a single gasless transaction using EIP-191 signatures.
          </AlertDescription>
        </Alert>
      </div>

      {/* Features Grid */}
      <div className="max-w-6xl mx-auto mb-8 grid md:grid-cols-3 gap-4">
        <Card className="border-primary/30">
          <CardHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-2">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="font-mono text-lg">Gasless Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Sign once with EIP-191, fishers execute the batch payment. No gas fees for the sender.
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="border-primary/30">
          <CardHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-2">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="font-mono text-lg">CSV Upload</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Upload a CSV file with addresses and amounts. System validates and prepares the batch transaction.
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="border-primary/30">
          <CardHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-2">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="font-mono text-lg">PYUSD Payroll</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Stable USD-denominated payroll in PYUSD. Perfect for DAOs, startups, and remote teams.
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* Upload Section */}
      <div className="max-w-6xl mx-auto">
        <Card className="bg-card/50 backdrop-blur mb-6">
          <CardHeader>
            <CardTitle className="font-mono">Step 1: Upload Payroll CSV</CardTitle>
            <CardDescription>
              CSV format: <code className="text-xs bg-muted px-1 py-0.5 rounded">address,amount,name (optional)</code>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-primary/30 rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
              <div className="flex flex-col items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Upload CSV File</h3>
                  <p className="text-sm text-muted-foreground mb-4">or drag and drop here</p>
                </div>
                <div className="flex gap-3">
                  <Button className="font-mono" onClick={() => document.getElementById("csv-upload")?.click()}>
                    <Upload className="h-4 w-4 mr-2" />
                    Choose File
                  </Button>
                  <input
                    id="csv-upload"
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled
                  />
                  <Button variant="outline" className="font-mono">
                    <Download className="h-4 w-4 mr-2" />
                    Download Template
                  </Button>
                </div>
                {csvFile && (
                  <p className="text-sm text-primary mt-2">
                    Selected: <code className="font-mono">{csvFile.name}</code>
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preview Section (shown when file is uploaded) */}
        {showPreview && (
          <Card className="bg-card/50 backdrop-blur mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-mono">Step 2: Review Recipients</CardTitle>
                  <CardDescription>Preview of payroll distribution</CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total Recipients</p>
                  <p className="text-2xl font-bold font-mono">{mockPayrollData.length}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3 font-mono text-sm">Recipient</th>
                      <th className="text-left p-3 font-mono text-sm">Address</th>
                      <th className="text-right p-3 font-mono text-sm">Amount (PYUSD)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockPayrollData.map((item, index) => (
                      <tr key={index} className="border-t border-border/50">
                        <td className="p-3 text-sm">{item.name}</td>
                        <td className="p-3 text-sm font-mono text-muted-foreground">
                          {item.address.slice(0, 6)}...{item.address.slice(-4)}
                        </td>
                        <td className="p-3 text-sm font-mono text-right font-semibold">${item.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-muted/50 border-t-2 border-primary/30">
                    <tr>
                      <td colSpan={2} className="p-3 font-semibold">
                        Total Distribution
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-lg text-primary">${totalAmount}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="mt-6 space-y-4">
                <Alert className="border-primary/30 bg-primary/5">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Transaction Details:</strong> This will use EVVM's <code className="text-xs bg-muted px-1 py-0.5 rounded">dispersePay</code> function
                    to distribute ${totalAmount} PYUSD to {mockPayrollData.length} recipients in a single gasless
                    transaction. You'll only need to sign once.
                  </AlertDescription>
                </Alert>

                <div className="flex gap-3">
                  <Button className="flex-1 font-mono" size="lg" disabled>
                    Sign & Execute Payroll
                  </Button>
                  <Button variant="outline" size="lg" onClick={() => setShowPreview(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Documentation Card */}
        <Card className="border-dashed border-2 border-primary/30">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              CSV Format Guide
            </h3>
            <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto mb-4">
              <code>
                {`address,amount,name
0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb,1250.00,Alice Johnson
0x8b3f2C4d5E6A7f8e9C1b2A3D4e5F6c7D8e9F0A1B,1500.00,Bob Smith
0x3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f,1000.00,Carol Davis`}
              </code>
            </pre>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• First line must be headers: address,amount,name</p>
              <p>• Address: Valid Ethereum address (0x...)</p>
              <p>• Amount: PYUSD amount in USD (no commas)</p>
              <p>• Name: Optional identifier for recipient</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
