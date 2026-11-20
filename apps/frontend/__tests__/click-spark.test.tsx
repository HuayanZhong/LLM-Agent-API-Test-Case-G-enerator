import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
// 真实组件:验证特效层不拦截点击与焦点,而不是 mock 掉被测行为
import ClickSpark from "@workspace/ui/components/click-spark"

describe("ClickSpark 交互不拦截", () => {
  it("点击按钮时自身回调正常触发", () => {
    const onClick = vi.fn<() => void>()
    render(
      <ClickSpark>
        <button onClick={onClick}>提交</button>
      </ClickSpark>,
    )

    fireEvent.click(screen.getByRole("button", { name: "提交" }))

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it("输入框可正常获得焦点并立即输入", () => {
    render(
      <ClickSpark>
        <input aria-label="邮箱" />
      </ClickSpark>,
    )

    // jsdom 的 fireEvent.click 不实现聚焦默认行为,这里显式 focus 验证特效层无干扰
    const input = screen.getByLabelText("邮箱")
    input.focus()
    fireEvent.change(input, { target: { value: "a@b.c" } })

    expect(input).toHaveFocus()
    expect(input).toHaveValue("a@b.c")
  })
})
