"use client"

import { useTheme } from "@/contexts/theme-context"
import { Button } from "@/components/ui/button"

export function ModeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleTheme}
      className="font-mono text-xs bg-transparent"
      aria-label="Toggle theme"
    >
      {theme === "cyberpunk" ? "CYBER" : "NORMIE"}
    </Button>
  )
}
