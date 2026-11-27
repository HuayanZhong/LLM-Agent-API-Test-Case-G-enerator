import "@workspace/ui/globals.css"

import { AppTitlebar } from "@/components/layout/app-titlebar"
import { ClickSparkProvider } from "@/components/layout/click-spark-provider"
import { LocaleProvider } from "@/components/layout/locale-provider"
import { ThemeProvider } from "@/components/layout/theme-provider"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // 静态导出每个路由只有一份 HTML，lang 只能固定为默认语言；
  // 实际语言由 LocaleProvider 在挂载与切换时写回 documentElement。
  return (
    <html lang="zh-CN" suppressHydrationWarning className="font-sans antialiased">
      <body>
        <ThemeProvider>
          {/* 语言上下文包住全站：Provider 内部同时挂 next-intl 与本地偏好。 */}
          <LocaleProvider>
            {/* 全站点击火花:一次挂载覆盖所有页面,后续新页面无需再接。 */}
            <ClickSparkProvider>
              {/* 窗口标题栏需要主题与语言上下文；它只提供拖拽区与切换入口，不显示标题。 */}
              <AppTitlebar />
              {children}
            </ClickSparkProvider>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
