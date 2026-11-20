import "@workspace/ui/globals.css"

import { ClickSparkProvider } from "@/components/click-spark-provider"
import { ThemeProvider } from "@/components/theme-provider"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning className="font-sans antialiased">
      <body>
        <ThemeProvider>
          {/* 全站点击火花:一次挂载覆盖所有页面,后续新页面无需再接。 */}
          <ClickSparkProvider>{children}</ClickSparkProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
