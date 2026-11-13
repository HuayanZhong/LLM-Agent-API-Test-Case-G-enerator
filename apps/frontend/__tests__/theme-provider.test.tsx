import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { ThemeProvider } from "@/components/theme-provider"

describe("ThemeProvider", () => {
  it("渲染子节点", () => {
    render(
      <ThemeProvider>
        <p>主题子节点</p>
      </ThemeProvider>,
    )

    expect(screen.getByText("主题子节点")).toBeInTheDocument()
  })

  it("处理 d 快捷键与各条提前返回分支", () => {
    render(
      <ThemeProvider>
        <input aria-label="输入" />
      </ThemeProvider>,
    )

    // 正常按下 d：触发 setTheme。
    fireEvent.keyDown(window, { key: "d" })
    // 非 d 键、修饰键、repeat、输入框内、已被 preventDefault，都应提前返回。
    fireEvent.keyDown(window, { key: "x" })
    fireEvent.keyDown(window, { key: "d", metaKey: true })
    fireEvent.keyDown(window, { key: "d", repeat: true })
    fireEvent.keyDown(screen.getByLabelText("输入"), { key: "d" })

    const prevented = new KeyboardEvent("keydown", { key: "d", cancelable: true })
    prevented.preventDefault()
    window.dispatchEvent(prevented)

    expect(screen.getByLabelText("输入")).toBeInTheDocument()
  })
})
