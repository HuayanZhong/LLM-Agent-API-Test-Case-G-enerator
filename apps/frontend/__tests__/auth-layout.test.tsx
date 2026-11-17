import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import AuthLayout from "@/app/(auth)/layout"

// 布局测试不需要真实 Toast 容器与主题上下文，只验证组合关系。
vi.mock("@workspace/ui/components/sonner", () => ({
  Toaster: () => <div data-testid="toaster" />,
}))

vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: "light", setTheme: vi.fn<() => void>() }),
}))

describe("AuthLayout", () => {
  it("组合品牌栏、主题按钮、移动端标识、表单内容与 Toast 容器", () => {
    render(
      <AuthLayout>
        <p>认证表单内容</p>
      </AuthLayout>,
    )

    expect(screen.getByText("认证表单内容")).toBeInTheDocument()
    expect(screen.getAllByText("接口测试用例辅助生成系统").length).toBeGreaterThan(0)
    expect(screen.getByRole("button", { name: "切换主题" })).toBeInTheDocument()
    expect(screen.getByTestId("toaster")).toBeInTheDocument()
  })
})
