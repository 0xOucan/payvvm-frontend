"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Camera, X } from "lucide-react"

interface QRScannerProps {
  onScan: (data: string) => void
  onClose: () => void
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        })
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
        setHasPermission(true)
      } catch (err) {
        console.error("[v0] Camera access error:", err)
        setError("Camera access denied. Please enable camera permissions.")
        setHasPermission(false)
      }
    }

    startCamera()

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  const handleManualInput = () => {
    // TODO: Implement QR code scanning logic
    // For now, simulate a scan
    const mockData = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
    onScan(mockData)
  }

  return (
    <Card className="fixed inset-4 z-50 flex flex-col bg-background/95 backdrop-blur">
      <CardContent className="flex-1 flex flex-col p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-mono font-semibold">Scan QR Code</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 flex items-center justify-center bg-muted rounded-lg overflow-hidden">
          {hasPermission === null && <p className="text-muted-foreground">Requesting camera access...</p>}

          {hasPermission === false && (
            <div className="text-center space-y-4 p-6">
              <Camera className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          )}

          {hasPermission === true && (
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
          )}
        </div>

        <div className="mt-4 space-y-2">
          <Button onClick={handleManualInput} className="w-full">
            Simulate Scan (Demo)
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            QR scanning will be implemented with a production QR library
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
