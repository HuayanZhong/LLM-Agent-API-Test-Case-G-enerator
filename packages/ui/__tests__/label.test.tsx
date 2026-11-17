import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { Label } from "@workspace/ui/components/label"

describe("Label", () => {
  it("通过 htmlFor 关联输入框", () => {
    render(
      <>
        <Label htmlFor="account">账号</Label>
        <input id="account" />
      </>,
    )

    expect(screen.getByLabelText("账号")).toBeInTheDocument()
    expect(screen.getByText("账号")).toHaveAttribute("data-slot", "label")
  })

  it("合并外部 className", () => {
    render(<Label className="custom-class">密码</Label>)

    expect(screen.getByText("密码")).toHaveClass("custom-class")
  })
})
