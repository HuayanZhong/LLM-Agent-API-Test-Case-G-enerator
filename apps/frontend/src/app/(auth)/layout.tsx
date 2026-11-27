import type { ReactNode } from "react"

import { Toaster } from "@workspace/ui/components/sonner"

import { LoginBrandPanel } from "./_components/brand/login-brand-panel"
import { ProductMasthead } from "./_components/brand/product-masthead"

/**
 * 认证路由组布局：/login 与 /register 共用品牌栏、移动端标识与 Toast 容器。
 * 语言与主题入口由全局窗口标题栏提供，认证布局不再重复绘制。
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    // 认证页只定义两级布局：md 窄双栏 2:3，lg 起等宽双栏；尺寸交给根字号统一缩放。
    // grid-rows-1 让唯一一行撑满 min-h-svh，避免大屏底部出现面板背景以外的空白带。
    <main className="grid min-h-svh grid-rows-1 md:grid-cols-[2fr_3fr] lg:grid-cols-2">
      <LoginBrandPanel className="xl:px-12 xl:py-12 2xl:px-16" />

      <section className="flex min-w-0 items-center justify-center bg-background px-6 py-8 sm:px-10 sm:py-10 md:px-8 xl:px-16">
        {/* 表单列单独限宽；xl 起只放宽一档，后续由根字号继续放大。 */}
        <div className="w-full max-w-sm xl:max-w-md">
          {/* 移动端产品标识：md 起由左栏承担，这里隐藏。 */}
          <ProductMasthead className="mb-6 sm:mb-8 md:hidden" markClassName="size-8 sm:size-9" />
          {children}
        </div>
      </section>

      {/* 标题栏固定在窗口顶部；Toast 向下偏移，避免被拖拽区盖住。 */}
      <Toaster
        position="top-center"
        offset={{ top: "calc(var(--app-titlebar-height) + 0.5rem)" }}
      />
    </main>
  )
}
