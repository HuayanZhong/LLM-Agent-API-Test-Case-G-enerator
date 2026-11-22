import type { ReactNode } from "react"

import { Toaster } from "@workspace/ui/components/sonner"

import { ThemeToggle } from "@/components/theme-toggle"

import { LoginBrandPanel } from "./_components/login-brand-panel"
import { ProductMark } from "./_components/product-mark"

/**
 * 认证路由组布局：/login 与 /register 共用品牌栏、移动端标识、主题按钮和 Toast 容器。
 * 路由组目录名带括号，不会进入 URL。
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    // 认证页只定义两级布局：md 窄双栏 2:3，lg 起等宽双栏；尺寸交给根字号统一缩放。
    // grid-rows-1 让唯一一行撑满 min-h-svh，避免大屏底部出现面板背景以外的空白带。
    <main className="grid min-h-svh grid-rows-1 md:grid-cols-[2fr_3fr] lg:grid-cols-2">
      <LoginBrandPanel className="xl:px-12 xl:py-12 2xl:px-16" />

      {/* 主题按钮固定在页面右上角；表单内部不再重复放按钮。 */}
      <div className="fixed top-4 right-4 z-50 sm:top-6 sm:right-6">
        <ThemeToggle />
      </div>

      <section className="flex min-w-0 items-center justify-center bg-background px-6 py-8 sm:px-10 sm:py-10 md:px-8 xl:px-16">
        {/* 表单列单独限宽；xl 起只放宽一档，后续由根字号继续放大。 */}
        <div className="w-full max-w-sm xl:max-w-md">
          {/* 移动端产品标识：md 起由左栏承担，这里隐藏。 */}
          <div className="mb-6 flex items-center gap-3 sm:mb-8 md:hidden">
            <ProductMark className="size-8 sm:size-9" />
            <div>
              <p className="text-sm font-semibold tracking-tight">接口测试用例辅助生成系统</p>
              <p className="mt-0.5 text-xs tracking-widest text-muted-foreground">
                接口测试 · 智能体辅助
              </p>
            </div>
          </div>
          {children}
        </div>
      </section>

      {/* sonner 组件保持 shadcn CLI 默认；类型由默认图标区分，不做颜色或图标覆盖。 */}
      <Toaster position="top-center" />
    </main>
  )
}
