"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ModeToggle } from "./mode-toggle"
import { ConnectWalletButton } from "./connect-wallet-button"
import { InstallPWAButton } from "./install-pwa-button"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/send", label: "Send" },
  { href: "/invoice", label: "Invoice" },
  { href: "/explorer", label: "Explorer" },
  { href: "/faucets", label: "Faucets" },
  { href: "/withdraw", label: "Withdraw" },
  { href: "/profile", label: "Profile" },
]

export function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <span className="font-mono text-xl font-bold text-primary glitch-hover">PayVVM</span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {navItems.slice(1, 5).map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-3 py-2 text-sm font-medium transition-colors hover:text-primary",
                    pathname === item.href ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <InstallPWAButton />
            <ModeToggle />
            <ConnectWalletButton />
          </div>
        </div>
      </div>
    </nav>
  )
}
