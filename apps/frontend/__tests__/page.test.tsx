import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import Page from "@/app/page"

describe("Page", () => {
  it("渲染骨架标题与入口按钮", () => {
    render(<Page />)

    expect(screen.getByText("前端骨架已就绪")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "开始" })).toBeInTheDocument()
  })
})
