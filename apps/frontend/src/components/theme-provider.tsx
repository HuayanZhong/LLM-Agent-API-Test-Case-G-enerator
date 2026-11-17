"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

/**
 * 全局主题上下文：只负责 class 策略、系统默认值与主题切换后的持久化。
 * 切换入口是页面上的可见按钮（当前为登录页右上角），不再注册全局键盘快捷键。
 */
function ThemeProvider({ children, ...props }: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      // Tailwind 的 dark 变体依赖 html.dark class。
      attribute="class"
      // 默认跟随系统；用户点按钮后 next-themes 会保存选择。
      defaultTheme="system"
      enableSystem
      // 切换时禁用 CSS 过渡，避免整页颜色渐变造成闪烁。
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}

export { ThemeProvider }
