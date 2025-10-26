"use client"

import { useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"

interface InvoiceQRProps {
  amount: string
  memo?: string
  address: string
}

export function InvoiceQR({ amount, memo, address }: InvoiceQRProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    // Generate QR code data
    const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
    const qrData = `${baseUrl}/send?to=${address}&amount=${amount}${memo ? `&memo=${encodeURIComponent(memo)}` : ""}`

    // TODO: Use a real QR code library like 'qrcode' in production
    // For now, display the data as text
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Simple placeholder visualization
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, 300, 300)

    ctx.fillStyle = "#000000"
    ctx.font = "12px monospace"
    ctx.textAlign = "center"

    // Draw mock QR pattern
    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < 10; j++) {
        if (Math.random() > 0.5) {
          ctx.fillRect(30 + i * 24, 30 + j * 24, 20, 20)
        }
      }
    }

    // Add text below
    ctx.fillText("Scan to Pay", 150, 280)
  }, [amount, memo, address])

  return (
    <Card className="bg-white">
      <CardContent className="p-6 flex flex-col items-center">
        <canvas ref={canvasRef} width={300} height={300} className="rounded-lg" />
        <p className="mt-4 text-xs text-gray-600 text-center max-w-xs break-all font-mono">
          {typeof window !== "undefined" &&
            `${window.location.origin}/send?to=${address}&amount=${amount}${memo ? `&memo=${encodeURIComponent(memo)}` : ""}`}
        </p>
      </CardContent>
    </Card>
  )
}
