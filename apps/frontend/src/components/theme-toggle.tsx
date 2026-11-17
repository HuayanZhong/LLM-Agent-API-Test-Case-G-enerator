"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@workspace/ui/components/button"

/**
 * 主题切换按钮：页面上的唯一入口。
 * 图标由 CSS 的 dark 变体切换，不依赖 mounted 状态，避免 hydration 前后不一致。
 */
function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label="切换主题"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      <Moon className="size-4 dark:hidden" aria-hidden="true" />
      <Sun className="hidden size-4 dark:block" aria-hidden="true" />
    </Button>
  )
}

export { ThemeToggle }
