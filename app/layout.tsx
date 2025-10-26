import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { ThemeProvider } from "@/contexts/theme-context"
import { WalletProvider } from "@/contexts/wallet-context"
import { Navbar } from "@/components/navbar"
import { Toaster } from "@/components/ui/toaster"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "PayVVM - Gasless PYUSD Wallet",
  description: "Gasless PYUSD payments powered by EVVM. Smart-contract native. No new infra. Data by Envio HyperSync.",
  generator: "v0.app",
  manifest: "/manifest.webmanifest",
  themeColor: "#00FF7F",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans antialiased`}>
        <ThemeProvider>
          <WalletProvider>
            <div className="scanlines min-h-screen">
              <Navbar />
              <main>{children}</main>
              <Toaster />
            </div>
          </WalletProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
