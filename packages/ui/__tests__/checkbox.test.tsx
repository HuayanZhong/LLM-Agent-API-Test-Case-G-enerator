import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { Checkbox } from "@workspace/ui/components/checkbox"

describe("Checkbox", () => {
  it("点击后切换选中状态并回调", () => {
    const onCheckedChange = vi.fn<(checked: boolean) => void>()
    render(<Checkbox aria-label="记住账号" onCheckedChange={onCheckedChange} />)

    const checkbox = screen.getByRole("checkbox", { name: "记住账号" })
    expect(checkbox).toHaveAttribute("aria-checked", "false")

    fireEvent.click(checkbox)

    expect(onCheckedChange).toHaveBeenCalledWith(true)
    expect(checkbox).toHaveAttribute("aria-checked", "true")
  })

  it("禁用时不可切换", () => {
    const onCheckedChange = vi.fn<(checked: boolean) => void>()
    render(<Checkbox aria-label="记住账号" disabled onCheckedChange={onCheckedChange} />)

    const checkbox = screen.getByRole("checkbox", { name: "记住账号" })
    fireEvent.click(checkbox)

    expect(onCheckedChange).not.toHaveBeenCalled()
    expect(checkbox).toBeDisabled()
  })
})
