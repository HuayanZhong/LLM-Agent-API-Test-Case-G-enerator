import { renderWithIntl } from "./test-utils"
import { screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import RegisterPage from "@/app/(auth)/register/page"

// 注册路由只负责渲染表单；品牌栏与主题按钮由 auth layout 组合。
vi.mock("sonner", () => ({
  toast: { error: vi.fn<() => void>(), success: vi.fn<() => void>() },
}))

describe("RegisterPage", () => {
  it("渲染注册表单与登录入口", () => {
    renderWithIntl(<RegisterPage />)

    expect(screen.getByRole("heading", { name: "注册工作台" })).toBeInTheDocument()
    expect(screen.getByRole("form", { name: "注册表单" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "返回登录" }).getAttribute("href")).toMatch(
      /^\/login\/?$/,
    )
  })
})
