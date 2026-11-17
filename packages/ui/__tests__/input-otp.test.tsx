import * as React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@workspace/ui/components/input-otp"

function Demo({ disabled = false }: { disabled?: boolean }) {
  const [value, setValue] = React.useState("")

  return (
    <InputOTP
      aria-label="验证码"
      maxLength={6}
      value={value}
      onChange={setValue}
      disabled={disabled}
    >
      <InputOTPGroup>
        {Array.from({ length: 6 }).map((_, index) => (
          <InputOTPSlot key={index} index={index} />
        ))}
      </InputOTPGroup>
    </InputOTP>
  )
}

function GroupedDemo({ invalid = false }: { invalid?: boolean }) {
  return (
    <InputOTP aria-label="验证码" aria-invalid={invalid} maxLength={6}>
      {[0, 2, 4].map((startIndex) => (
        <React.Fragment key={startIndex}>
          {startIndex > 0 ? <InputOTPSeparator /> : null}
          <InputOTPGroup>
            <InputOTPSlot index={startIndex} />
            <InputOTPSlot index={startIndex + 1} />
          </InputOTPGroup>
        </React.Fragment>
      ))}
    </InputOTP>
  )
}

describe("InputOTP", () => {
  it("渲染 6 个槽位并接受输入", () => {
    render(<Demo />)

    const slots = document.querySelectorAll('[data-slot="input-otp-slot"]')
    expect(slots).toHaveLength(6)

    const input = screen.getByLabelText("验证码")
    fireEvent.change(input, { target: { value: "123456" } })

    expect(slots[0]).toHaveTextContent("1")
    expect(slots[5]).toHaveTextContent("6")
  })

  it("禁用态不可输入", () => {
    render(<Demo disabled />)

    expect(screen.getByLabelText("验证码")).toBeDisabled()
  })

  it("支持 2 + 分隔符 + 2 + 分隔符 + 2 分组并透传错误态", () => {
    render(<GroupedDemo invalid />)

    // 与登录/注册页的验证码结构一致：三组、每组两槽、两组之间各一个分隔符。
    expect(document.querySelectorAll('[data-slot="input-otp-slot"]')).toHaveLength(6)
    expect(screen.getAllByRole("separator")).toHaveLength(2)
    expect(screen.getByLabelText("验证码")).toHaveAttribute("aria-invalid", "true")
  })
})

describe("InputOTPSeparator", () => {
  it("渲染分隔符", () => {
    render(<InputOTPSeparator />)

    expect(screen.getByRole("separator")).toBeInTheDocument()
  })
})
