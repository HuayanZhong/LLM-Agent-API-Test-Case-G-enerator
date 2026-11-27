import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { ThemeProvider } from "@/components/layout/theme-provider"

// 主题切换入口由页面按钮负责；这里只验证 Provider 能包裹并渲染子节点。
describe("ThemeProvider", () => {
  it("渲染子节点", () => {
    render(
      <ThemeProvider>
        <p>主题子节点</p>
      </ThemeProvider>,
    )

    expect(screen.getByText("主题子节点")).toBeInTheDocument()
  })
})
