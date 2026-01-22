"use client"

import { Sun, Moon } from "lucide-react"
import { useTheme } from "@/contexts/theme-context"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { themeMode, setThemeMode } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setThemeMode(themeMode === 'light' ? 'dark' : 'light')}
      className="glass-button text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
    >
      {themeMode === 'light' ? (
        <Moon className="w-5 h-5" />
      ) : (
        <Sun className="w-5 h-5" />
      )}
    </Button>
  )
}