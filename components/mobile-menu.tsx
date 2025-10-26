"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Menu, LayoutDashboard, Send, Receipt, Search, Sparkles, Users, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

const mobileNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/send", label: "Send", icon: Send },
  { href: "/invoice", label: "Invoice", icon: Receipt },
  { href: "/explorer", label: "Explorer", icon: Search },
  { href: "/subscriptions", label: "Subscriptions", icon: Sparkles },
  { href: "/payroll", label: "Payroll", icon: Users },
  { href: "/lending", label: "Lending", icon: TrendingUp },
]

export function MobileMenu() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild className="md:hidden">
        <Button variant="ghost" size="icon" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px]">
        <SheetHeader>
          <SheetTitle className="font-mono text-primary">PayVVM Menu</SheetTitle>
        </SheetHeader>
        <div className="mt-8 flex flex-col gap-2">
          {mobileNavItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                  "hover:bg-primary/10",
                  isActive ? "bg-primary/20 text-primary font-medium" : "text-muted-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </SheetContent>
    </Sheet>
  )
}
