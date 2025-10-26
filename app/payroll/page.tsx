"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Upload, Download, Users, DollarSign, FileText, Zap, Info, Plus, Trash2 } from "lucide-react"

const mockPayrollData = [
  { address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb", amount: "1250.00", name: "Alice Johnson" },
  { address: "0x8b3f2C4d5E6A7f8e9C1b2A3D4e5F6c7D8e9F0A1B", amount: "1500.00", name: "Bob Smith" },
  { address: "0x3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f", amount: "1000.00", name: "Carol Davis" },
  { address: "0x9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b", amount: "1750.00", name: "David Wilson" },
  { address: "0x5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f", amount: "1350.00", name: "Eve Martinez" },
]

interface Recipient {
  address: string
  amount: string
  name: string
}

export default function PayrollPage() {
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [recipients, setRecipients] = useState<Recipient[]>([
    { address: "", amount: "", name: "" },
  ])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCsvFile(e.target.files[0])
      setShowPreview(true)
    }
  }

  const addRecipient = () => {
    setRecipients([...recipients, { address: "", amount: "", name: "" }])
  }

  const removeRecipient = (index: number) => {
    if (recipients.length > 1) {
      setRecipients(recipients.filter((_, i) => i !== index))
    }
  }

  const updateRecipient = (index: number, field: keyof Recipient, value: string) => {
    const updated = [...recipients]
    updated[index][field] = value
    setRecipients(updated)
  }

  const totalAmount = mockPayrollData.reduce((sum, item) => sum + parseFloat(item.amount), 0).toFixed(2)
  const manualTotal = recipients
    .reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0)
    .toFixed(2)

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
          <Badge variant="outline" className="font-mono text-sm px-4 py-2 bg-amber-500/10 border-amber-500/50">
            COMING SOON
          </Badge>
        </div>
      </div>

      {/* Info Alert */}
      <div className="max-w-6xl mx-auto mb-6">
        <Alert className="border-amber-500/30 bg-amber-500/5">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>This feature is under development.</strong> Upload a CSV or manually add recipients. PayVVM will
            use EVVM's <code className="text-xs bg-muted px-1 py-0.5 rounded">dispersePay</code> function to distribute
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

      {/* Main Content with Tabs */}
      <div className="max-w-6xl mx-auto">
        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            <TabsTrigger value="csv">CSV Upload</TabsTrigger>
          </TabsList>

          {/* Manual Entry Tab */}
          <TabsContent value="manual" className="space-y-6">
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="font-mono">Add Recipients Manually</CardTitle>
                <CardDescription>Enter recipient addresses and PYUSD amounts one by one</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recipients.map((recipient, index) => (
                  <div key={index} className="flex gap-3 items-start">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Input
                        placeholder="0x... Address"
                        value={recipient.address}
                        onChange={(e) => updateRecipient(index, "address", e.target.value)}
                        className="font-mono text-sm"
                      />
                      <Input
                        placeholder="Amount (PYUSD)"
                        value={recipient.amount}
                        onChange={(e) => updateRecipient(index, "amount", e.target.value)}
                        className="font-mono"
                        type="number"
                        step="0.01"
                      />
                      <Input
                        placeholder="Name (optional)"
                        value={recipient.name}
                        onChange={(e) => updateRecipient(index, "name", e.target.value)}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRecipient(index)}
                      disabled={recipients.length === 1}
                      className="mt-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                <div className="flex gap-3 items-center pt-4 border-t">
                  <Button variant="outline" onClick={addRecipient} className="font-mono">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Recipient
                  </Button>
                  <div className="flex-1 text-right">
                    <span className="text-sm text-muted-foreground">Total: </span>
                    <span className="text-xl font-bold font-mono text-primary">${manualTotal}</span>
                  </div>
                </div>

                <Alert className="border-primary/30 bg-primary/5">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    This will use EVVM's <code className="text-xs bg-muted px-1 py-0.5 rounded">dispersePay</code>{" "}
                    function. One signature distributes to all {recipients.length} recipient
                    {recipients.length > 1 ? "s" : ""}.
                  </AlertDescription>
                </Alert>

                <Button className="w-full font-mono" size="lg" disabled>
                  Sign & Execute Payroll
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CSV Upload Tab */}
          <TabsContent value="csv" className="space-y-6">
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="font-mono">Upload Payroll CSV</CardTitle>
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
              <Card className="bg-card/50 backdrop-blur">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="font-mono">Review Recipients</CardTitle>
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
                        <strong>Transaction Details:</strong> This will use EVVM's{" "}
                        <code className="text-xs bg-muted px-1 py-0.5 rounded">dispersePay</code> function to distribute $
                        {totalAmount} PYUSD to {mockPayrollData.length} recipients in a single gasless transaction.
                        You'll only need to sign once.
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
          </TabsContent>
        </Tabs>

        {/* Documentation Card */}
        <Card className="mt-6 border-dashed border-2 border-primary/30">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              How dispersePay Works
            </h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                <strong className="text-foreground">Single Signature:</strong> Sign once with EIP-191 to authorize the
                entire batch distribution
              </p>
              <p>
                <strong className="text-foreground">Gasless Execution:</strong> Fisher bots execute the transaction and
                earn rewards, you pay no gas
              </p>
              <p>
                <strong className="text-foreground">Atomic Distribution:</strong> All recipients receive their PYUSD
                simultaneously in one transaction
              </p>
              <p>
                <strong className="text-foreground">CSV Format:</strong> First line must be headers: address,amount,name
              </p>
            </div>
            <div className="mt-4 pt-4 border-t space-y-2">
              <p className="text-xs font-mono text-muted-foreground">DOCUMENTATION</p>
              <div className="flex flex-wrap gap-2">
                <a
                  href="https://www.evvm.info/docs/EVVM/PaymentFunctions/dispersePay"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline font-mono"
                >
                  dispersePay Function →
                </a>
                <a
                  href="https://www.evvm.info/docs/SignatureStructures/EVVM/DispersePaySignatureStructure"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline font-mono"
                >
                  Signature Structure →
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
