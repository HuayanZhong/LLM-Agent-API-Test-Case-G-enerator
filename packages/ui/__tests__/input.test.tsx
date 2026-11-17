import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { Input } from "@workspace/ui/components/input"

describe("Input", () => {
  it("渲染输入框并透传原生属性", () => {
    render(<Input type="email" placeholder="账号" aria-invalid />)

    const input = screen.getByPlaceholderText("账号")
    expect(input).toHaveAttribute("type", "email")
    expect(input).toHaveAttribute("data-slot", "input")
    expect(input).toHaveAttribute("aria-invalid", "true")
  })

  it("合并外部 className 并转发输入事件", () => {
    const onChange = vi.fn<() => void>()
    render(<Input className="custom-class" onChange={onChange} />)

    const input = screen.getByRole("textbox")
    expect(input).toHaveClass("custom-class")

    fireEvent.change(input, { target: { value: "tester" } })
    expect(onChange).toHaveBeenCalledTimes(1)
  })
})
