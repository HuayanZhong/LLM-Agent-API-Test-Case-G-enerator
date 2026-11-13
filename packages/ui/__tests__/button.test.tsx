import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { Button } from "@workspace/ui/components/button"

describe("Button", () => {
  it("渲染默认按钮", () => {
    render(<Button>开始</Button>)

    const button = screen.getByRole("button", { name: "开始" })
    expect(button).toBeInTheDocument()
    expect(button.dataset.variant).toBe("default")
  })

  it("asChild 把样式交给子元素", () => {
    render(
      <Button asChild>
        <a href="/docs">文档</a>
      </Button>,
    )

    expect(screen.getByRole("link", { name: "文档" })).toBeInTheDocument()
  })

  it("variant 与 size 写入 data 属性", () => {
    render(
      <Button variant="destructive" size="lg">
        删除
      </Button>,
    )

    const button = screen.getByRole("button", { name: "删除" })
    expect(button.dataset.variant).toBe("destructive")
    expect(button.dataset.size).toBe("lg")
  })
})
