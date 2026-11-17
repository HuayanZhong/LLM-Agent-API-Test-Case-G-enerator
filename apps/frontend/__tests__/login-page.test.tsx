import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import LoginPage from "@/app/(auth)/login/page"

// 登录路由只负责渲染表单；品牌栏与主题按钮由 auth layout 组合。
vi.mock("sonner", () => ({
  toast: { error: vi.fn<() => void>(), success: vi.fn<() => void>() },
}))

describe("LoginPage", () => {
  it("渲染登录表单与注册入口", () => {
    render(<LoginPage />)

    expect(screen.getByRole("heading", { name: "登录工作台" })).toBeInTheDocument()
    expect(screen.getByRole("form", { name: "登录表单" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "去注册" }).getAttribute("href")).toMatch(
      /^\/register\/?$/,
    )
  })
})
