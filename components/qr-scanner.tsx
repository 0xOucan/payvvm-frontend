"use client"

import { useState, useRef, useEffect } from "react"
import { Html5Qrcode } from "html5-qrcode"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Camera, X } from "lucide-react"

interface QRScannerProps {
  onScan: (data: { to: string; amount: string; memo?: string; token?: 'PYUSD' | 'MATE' }) => void
  onClose: () => void
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
  const [error, setError] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const readerElementId = "qr-reader"

  useEffect(() => {
    // Initialize scanner when component mounts
    const initScanner = async () => {
      try {
        // Check if scanner already exists
        if (scannerRef.current) {
          return
        }

        const html5QrCode = new Html5Qrcode(readerElementId)
        scannerRef.current = html5QrCode

        // Request camera permissions and start scanning
        await html5QrCode.start(
          { facingMode: "environment" }, // Use back camera on mobile
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            // Successfully scanned QR code
            handleScan(decodedText)
          },
          (errorMessage) => {
            // Scanning errors (ignore these as they're frequent during scanning)
            // Only log critical errors
          }
        )

        setIsScanning(true)
        setError(null)
      } catch (err: any) {
        console.error("Error initializing scanner:", err)
        setError(err?.message || "Failed to access camera. Please check permissions.")
      }
    }

    initScanner()

    // Clean up scanner when component unmounts
    return () => {
      if (scannerRef.current && isScanning) {
        scannerRef.current
          .stop()
          .then(() => {
            scannerRef.current?.clear()
            scannerRef.current = null
          })
          .catch((err) => {
            console.error("Error stopping scanner:", err)
          })
      }
    }
  }, [])

  const handleScan = (decodedText: string) => {
    try {
      // Parse the QR code URL
      const url = new URL(decodedText)
      const params = new URLSearchParams(url.search)

      const to = params.get("to")
      const amount = params.get("amount")
      const memo = params.get("memo")
      const token = params.get("token") as 'PYUSD' | 'MATE' | null

      if (!to || !amount) {
        setError("Invalid QR code: missing recipient or amount")
        return
      }

      // Prepare scan data with token if valid
      const scanData = {
        to,
        amount,
        memo: memo || undefined,
        token: (token === 'PYUSD' || token === 'MATE') ? token : undefined
      }

      // Stop scanner and call onScan callback
      if (scannerRef.current && isScanning) {
        scannerRef.current
          .stop()
          .then(() => {
            scannerRef.current?.clear()
            scannerRef.current = null
            setIsScanning(false)
            onScan(scanData)
            onClose()
          })
          .catch((err) => {
            console.error("Error stopping scanner after scan:", err)
            onScan(scanData)
            onClose()
          })
      } else {
        onScan(scanData)
        onClose()
      }
    } catch (err: any) {
      console.error("Error parsing QR code:", err)
      setError("Invalid QR code format")
    }
  }

  const handleClose = () => {
    if (scannerRef.current && isScanning) {
      scannerRef.current
        .stop()
        .then(() => {
          scannerRef.current?.clear()
          scannerRef.current = null
          setIsScanning(false)
          onClose()
        })
        .catch((err) => {
          console.error("Error stopping scanner on close:", err)
          onClose()
        })
    } else {
      onClose()
    }
  }

  return (
    <Card className="fixed inset-4 z-50 flex flex-col bg-background/95 backdrop-blur">
      <CardContent className="flex-1 flex flex-col p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-mono font-semibold">Scan Payment QR Code</h3>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex-1 flex items-center justify-center bg-black rounded-lg overflow-hidden">
          <div id={readerElementId} className="w-full h-full" />
        </div>

        <p className="mt-4 text-xs text-center text-muted-foreground">
          Point your camera at a PayVVM invoice QR code to auto-fill the payment form
        </p>
      </CardContent>
    </Card>
  )
}
