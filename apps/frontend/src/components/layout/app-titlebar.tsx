"use client"

import { useEffect } from "react"
import { useTheme } from "next-themes"

import { LocaleToggle } from "@/components/controls/locale-toggle"
import { ThemeToggle } from "@/components/controls/theme-toggle"

/**
 * 全局窗口标题栏：不显示产品名或图标，整条透明地融入页面背景。
 * Windows 的系统按钮由 WCO 绘制，所以右侧预留按钮区；只有切换控件取消拖拽。
 * 浏览器预览没有桌面桥时，主题同步静默跳过。
 */
function AppTitlebar() {
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    // 主题由 next-themes 解析成 light / dark；空值（首帧或 system 未解析）不发送。
    if (resolvedTheme === "light" || resolvedTheme === "dark") {
      window.desktop?.setTitleBarTheme?.(resolvedTheme)
    }
  }, [resolvedTheme])

  return (
    <div
      data-testid="app-titlebar"
      className="fixed inset-x-0 top-0 z-50 flex h-(--app-titlebar-height) items-center justify-end gap-2 pr-36 [-webkit-app-region:drag]"
    >
      <div className="flex items-center gap-2 [-webkit-app-region:no-drag]">
        <LocaleToggle />
        <ThemeToggle />
      </div>
    </div>
  )
}

export { AppTitlebar }
