import { act, fireEvent, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { RegisterForm } from "@/app/(auth)/_components/forms/register-form"
import { CODE_RESEND_SECONDS, SUBMIT_DELAY_MS } from "@/app/(auth)/_lib/auth-constants"

import { renderWithIntl } from "./test-utils"

// Toast 是 sonner 的副作用；测试只断言调用，不渲染真实 Toast 容器。
const toast = vi.hoisted(() => ({
  error: vi.fn<(message: string, options?: unknown) => void>(),
  success: vi.fn<(message: string, options?: unknown) => void>(),
}))

vi.mock("sonner", () => ({ toast }))

function getForm() {
  return screen.getByRole("form", { name: "注册表单" })
}

function fill(email: string, password: string, code: string) {
  fireEvent.change(screen.getByLabelText("邮箱"), { target: { value: email } })
  fireEvent.change(screen.getByLabelText("设置密码"), { target: { value: password } })
  fireEvent.change(screen.getByLabelText("验证码"), { target: { value: code } })
}

beforeEach(() => {
  toast.error.mockClear()
  toast.success.mockClear()
  window.localStorage.clear()
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  window.localStorage.clear()
})

describe("RegisterForm", () => {
  it("渲染邮箱、密码、验证码、发送按钮与登录入口", () => {
    renderWithIntl(<RegisterForm />)

    expect(screen.getByLabelText("邮箱")).toBeInTheDocument()
    expect(screen.getByLabelText("设置密码")).toBeInTheDocument()
    expect(screen.getByLabelText("验证码")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "发送验证码" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "注册" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "返回登录" }).getAttribute("href")).toMatch(
      /^\/login\/?$/,
    )
  })

  it("空提交显示字段错误、Toast 汇总并聚焦邮箱", () => {
    renderWithIntl(<RegisterForm />)

    fireEvent.submit(getForm())

    expect(screen.getByText("请输入邮箱")).toBeInTheDocument()
    expect(screen.getByText("请输入密码")).toBeInTheDocument()
    expect(screen.getByText("请输入验证码")).toBeInTheDocument()
    expect(screen.getByLabelText("邮箱")).toHaveFocus()
    expect(screen.getByLabelText("邮箱")).toHaveAccessibleDescription("请输入邮箱")
    expect(toast.error).toHaveBeenCalledWith("请检查注册信息", {
      description: "邮箱、验证码或密码未通过校验，请按提示修改。",
    })
  })

  it("邮箱无效时不能发送验证码", () => {
    renderWithIntl(<RegisterForm />)
    fireEvent.change(screen.getByLabelText("邮箱"), { target: { value: "tester" } })

    fireEvent.click(screen.getByRole("button", { name: "发送验证码" }))

    expect(screen.getByText("请输入有效邮箱")).toBeInTheDocument()
    expect(screen.getByLabelText("邮箱")).toHaveFocus()
    expect(toast.error).toHaveBeenCalledWith("请先填写有效邮箱", expect.any(Object))
    expect(toast.success).not.toHaveBeenCalled()
  })

  it("验证码格式错误优先于“未发送”提示", () => {
    renderWithIntl(<RegisterForm />)
    fireEvent.change(screen.getByLabelText("邮箱"), { target: { value: "tester@example.com" } })
    fireEvent.change(screen.getByLabelText("设置密码"), { target: { value: "123456" } })
    fireEvent.change(screen.getByLabelText("验证码"), { target: { value: "12345" } })

    fireEvent.submit(getForm())

    // 未点发送但格式不合法时，必须显示格式错误，而不是被“请先获取验证码”掩盖。
    expect(screen.getByText("请输入 6 位数字验证码")).toBeInTheDocument()
    expect(screen.queryByText("请先获取验证码")).not.toBeInTheDocument()

    fireEvent.change(screen.getByLabelText("验证码"), { target: { value: "123456" } })
    fireEvent.submit(getForm())

    expect(screen.getByText("请先获取验证码")).toBeInTheDocument()
  })

  it("发送验证码成功后清除已失效的“请先获取验证码”", () => {
    renderWithIntl(<RegisterForm />)
    fill("tester@example.com", "123456", "123456")
    fireEvent.submit(getForm())
    expect(screen.getByText("请先获取验证码")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "发送验证码" }))

    expect(screen.queryByText("请先获取验证码")).not.toBeInTheDocument()
    fireEvent.submit(getForm())
    expect(screen.getByRole("button", { name: /正在注册/ })).toBeDisabled()
  })

  it("发送验证码后进入冷却倒计时，归零后恢复可点击", () => {
    renderWithIntl(<RegisterForm />)
    fireEvent.change(screen.getByLabelText("邮箱"), { target: { value: "tester@example.com" } })

    fireEvent.click(screen.getByRole("button", { name: "发送验证码" }))

    expect(toast.success).toHaveBeenCalledWith("验证码已发送（演示）", {
      description: "演示模式不会真正发送邮件，请输入任意 6 位数字继续。",
    })
    expect(screen.getByRole("button", { name: `${CODE_RESEND_SECONDS}s 后重发` })).toBeDisabled()

    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(
      screen.getByRole("button", { name: `${CODE_RESEND_SECONDS - 1}s 后重发` }),
    ).toBeDisabled()

    // 逐秒推进到 0，覆盖 `current <= 1 ? 0` 的归零分支。
    for (let second = CODE_RESEND_SECONDS - 1; second > 0; second -= 1) {
      act(() => {
        vi.advanceTimersByTime(1000)
      })
    }

    expect(screen.getByRole("button", { name: "发送验证码" })).toBeEnabled()

    // 归零后必须停止倒计时；再推进时间不应回到“Ns 后重发”。
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(screen.getByRole("button", { name: "发送验证码" })).toBeEnabled()
  })

  it("验证码格式错误时聚焦验证码", () => {
    renderWithIntl(<RegisterForm />)
    fireEvent.change(screen.getByLabelText("邮箱"), { target: { value: "tester@example.com" } })
    fireEvent.click(screen.getByRole("button", { name: "发送验证码" }))
    fireEvent.change(screen.getByLabelText("设置密码"), { target: { value: "123456" } })
    fireEvent.change(screen.getByLabelText("验证码"), { target: { value: "12345" } })

    fireEvent.submit(getForm())

    expect(screen.getByText("请输入 6 位数字验证码")).toBeInTheDocument()
    expect(screen.getByLabelText("验证码")).toHaveAccessibleDescription("请输入 6 位数字验证码")
    expect(screen.getByLabelText("验证码")).toHaveFocus()
  })

  it("提交时邮箱格式错误会聚焦邮箱", () => {
    renderWithIntl(<RegisterForm />)
    fill("tester", "123456", "123456")

    fireEvent.submit(getForm())

    expect(screen.getByText("请输入有效邮箱")).toBeInTheDocument()
    expect(screen.getByLabelText("邮箱")).toHaveFocus()
    expect(toast.error).toHaveBeenCalledWith("请检查注册信息", {
      description: "邮箱、验证码或密码未通过校验，请按提示修改。",
    })
  })

  it("密码过短时聚焦密码", () => {
    renderWithIntl(<RegisterForm />)
    fireEvent.change(screen.getByLabelText("邮箱"), { target: { value: "tester@example.com" } })
    fireEvent.click(screen.getByRole("button", { name: "发送验证码" }))
    fireEvent.change(screen.getByLabelText("设置密码"), { target: { value: "12345" } })
    fireEvent.change(screen.getByLabelText("验证码"), { target: { value: "123456" } })

    fireEvent.submit(getForm())

    expect(screen.getByText("密码至少 6 位")).toBeInTheDocument()
    expect(screen.getByLabelText("设置密码")).toHaveAccessibleDescription("密码至少 6 位")
    expect(screen.getByLabelText("设置密码")).toHaveFocus()
  })

  it("合法提交显示 loading 并弹出注册成功 Toast，不落盘也不发请求", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch")
    renderWithIntl(<RegisterForm />)
    fireEvent.change(screen.getByLabelText("邮箱"), { target: { value: "tester@example.com" } })
    fireEvent.click(screen.getByRole("button", { name: "发送验证码" }))
    fill("tester@example.com", "123456", "123456")

    fireEvent.submit(getForm())

    expect(screen.getByRole("button", { name: /正在注册/ })).toBeDisabled()

    act(() => {
      vi.advanceTimersByTime(SUBMIT_DELAY_MS)
    })

    expect(toast.success).toHaveBeenCalledWith("注册演示完成", {
      description: "Supabase 邮箱验证码流程尚未接入，不会创建真实账号。",
    })
    // 演示注册必须在本地也无痕：不写账号、不存密码、不发网络请求。
    expect(window.localStorage.length).toBe(0)
    expect(fetchSpy).not.toHaveBeenCalled()
    fetchSpy.mockRestore()
  })

  it("首次提交后修改输入会重新校验", () => {
    renderWithIntl(<RegisterForm />)
    fireEvent.submit(getForm())
    expect(screen.getByText("请输入邮箱")).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText("邮箱"), {
      target: { value: "tester@example.com" },
    })
    fireEvent.click(screen.getByRole("button", { name: "发送验证码" }))
    fireEvent.change(screen.getByLabelText("设置密码"), { target: { value: "123456" } })
    fireEvent.change(screen.getByLabelText("验证码"), { target: { value: "123456" } })

    expect(screen.queryByText("请输入邮箱")).not.toBeInTheDocument()
    expect(screen.queryByText("请先获取验证码")).not.toBeInTheDocument()
  })

  it("提交中重复提交只产生一次注册成功反馈，成功后再次提交可重新触发", () => {
    renderWithIntl(<RegisterForm />)
    fireEvent.change(screen.getByLabelText("邮箱"), {
      target: { value: "tester@example.com" },
    })
    fireEvent.click(screen.getByRole("button", { name: "发送验证码" }))
    fill("tester@example.com", "123456", "123456")

    // 发送验证码也走 toast.success；先清掉，避免把发送提示算进注册反馈。
    toast.success.mockClear()

    fireEvent.submit(getForm())
    fireEvent.submit(getForm())
    act(() => {
      vi.advanceTimersByTime(SUBMIT_DELAY_MS)
    })
    expect(toast.success).toHaveBeenCalledTimes(1)
    expect(toast.success).toHaveBeenCalledWith("注册演示完成", {
      description: "Supabase 邮箱验证码流程尚未接入，不会创建真实账号。",
    })

    fireEvent.submit(getForm())
    act(() => {
      vi.advanceTimersByTime(SUBMIT_DELAY_MS)
    })
    expect(toast.success).toHaveBeenCalledTimes(2)
  })

  it("修改邮箱会清空已发送的验证码状态", () => {
    renderWithIntl(<RegisterForm />)
    fireEvent.change(screen.getByLabelText("邮箱"), { target: { value: "first@example.com" } })
    fireEvent.click(screen.getByRole("button", { name: "发送验证码" }))
    fireEvent.change(screen.getByLabelText("验证码"), { target: { value: "123456" } })

    fireEvent.change(screen.getByLabelText("邮箱"), { target: { value: "second@example.com" } })

    expect(screen.getByLabelText("验证码")).toHaveValue("")
    expect(screen.getByRole("button", { name: "发送验证码" })).toBeEnabled()
  })

  it("改邮箱后用空验证码重新校验，不复用旧验证码", () => {
    renderWithIntl(<RegisterForm />)
    fill("tester@example.com", "12345", "123456")
    fireEvent.click(screen.getByRole("button", { name: "发送验证码" }))
    fireEvent.submit(getForm())
    // 提交后密码错误；验证码本身格式合法且已发送，没有错误。
    expect(screen.getByText("密码至少 6 位")).toBeInTheDocument()
    expect(screen.queryByText("请输入 6 位数字验证码")).not.toBeInTheDocument()

    fireEvent.change(screen.getByLabelText("邮箱"), { target: { value: "other@example.com" } })

    // 验证码已被清空，必须按空值报错，而不是继续用改邮箱前的旧验证码判定通过。
    expect(screen.getByText("请输入验证码")).toBeInTheDocument()
    expect(screen.queryByText("请先获取验证码")).not.toBeInTheDocument()
  })

  it("密码与验证码同时错误时，焦点按视觉顺序先到密码", () => {
    renderWithIntl(<RegisterForm />)
    fill("tester@example.com", "12345", "12345")

    fireEvent.submit(getForm())

    expect(screen.getByLabelText("设置密码")).toHaveFocus()
  })

  it("卸载时清理提交定时器与倒计时", () => {
    const { unmount } = renderWithIntl(<RegisterForm />)
    fireEvent.change(screen.getByLabelText("邮箱"), { target: { value: "tester@example.com" } })
    fireEvent.click(screen.getByRole("button", { name: "发送验证码" }))
    fill("tester@example.com", "123456", "123456")
    fireEvent.submit(getForm())

    unmount()

    expect(vi.getTimerCount()).toBe(0)
  })
})
