"use client"

import { useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import QRCode from "qrcode"

interface InvoiceQRProps {
  amount: string
  memo?: string
  address: string
  token?: 'PYUSD' | 'MATE'
}

export function InvoiceQR({ amount, memo, address, token = 'PYUSD' }: InvoiceQRProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    // Generate QR code data with token parameter
    const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
    const qrData = `${baseUrl}/send?to=${address}&amount=${amount}&token=${token}${memo ? `&memo=${encodeURIComponent(memo)}` : ""}`

    const canvas = canvasRef.current
    if (!canvas) return

    // Generate real QR code using qrcode library
    QRCode.toCanvas(
      canvas,
      qrData,
      {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
        errorCorrectionLevel: "M",
      },
      (error) => {
        if (error) {
          console.error("Error generating QR code:", error)
        }
      }
    )
  }, [amount, memo, address, token])

  return (
    <Card className="bg-white">
      <CardContent className="p-6 flex flex-col items-center">
        <canvas ref={canvasRef} width={300} height={300} className="rounded-lg" />
        <p className="mt-4 text-xs text-gray-600 text-center max-w-xs break-all font-mono">
          {typeof window !== "undefined" &&
            `${window.location.origin}/send?to=${address}&amount=${amount}&token=${token}${memo ? `&memo=${encodeURIComponent(memo)}` : ""}`}
        </p>
      </CardContent>
    </Card>
  )
}
