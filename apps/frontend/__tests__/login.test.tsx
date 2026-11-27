import { act, fireEvent, screen } from "@testing-library/react"
import { renderToString } from "react-dom/server"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { LoginForm } from "@/app/(auth)/_components/forms/login-form"
import { REMEMBERED_EMAIL_KEY, SUBMIT_DELAY_MS } from "@/app/(auth)/_lib/auth-constants"

import { IntlTestProvider, renderWithIntl } from "./test-utils"

// Toast 是 sonner 的副作用；测试只断言调用，不渲染真实 Toast 容器。
const toast = vi.hoisted(() => ({
  error: vi.fn<(message: string, options?: unknown) => void>(),
  success: vi.fn<(message: string, options?: unknown) => void>(),
}))

vi.mock("sonner", () => ({ toast }))

function getForm() {
  return screen.getByRole("form", { name: "登录表单" })
}

function fill(email: string, password: string) {
  fireEvent.change(screen.getByLabelText("邮箱"), { target: { value: email } })
  fireEvent.change(screen.getByLabelText("密码"), { target: { value: password } })
}

// 每个用例重置 Toast、清空邮箱存储并启用假定时器，避免用例之间互相影响。
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

describe("LoginForm", () => {
  it("渲染邮箱、密码、登录按钮与注册入口", () => {
    renderWithIntl(<LoginForm />)

    expect(screen.getByLabelText("邮箱")).toBeInTheDocument()
    expect(screen.getByLabelText("密码")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "登录" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "去注册" }).getAttribute("href")).toMatch(
      /^\/register\/?$/,
    )
  })

  it("空提交显示字段错误、Toast 汇总并聚焦邮箱", () => {
    renderWithIntl(<LoginForm />)

    fireEvent.submit(getForm())

    expect(screen.getByText("请输入邮箱")).toBeInTheDocument()
    expect(screen.getByText("请输入密码")).toBeInTheDocument()
    expect(screen.getByLabelText("邮箱")).toHaveAttribute("aria-invalid", "true")
    expect(screen.getByLabelText("邮箱")).toHaveAccessibleDescription("请输入邮箱")
    expect(screen.getByLabelText("密码")).toHaveAccessibleDescription("请输入密码")
    expect(screen.getByLabelText("邮箱")).toHaveFocus()
    expect(toast.error).toHaveBeenCalledWith("请检查登录信息", {
      description: "邮箱或密码未通过校验，请按提示修改。",
    })
  })

  it("邮箱格式错误与短密码同时显示", () => {
    renderWithIntl(<LoginForm />)
    fill("tester", "12345")

    fireEvent.submit(getForm())

    expect(screen.getByText("请输入有效邮箱")).toBeInTheDocument()
    expect(screen.getByText("密码至少 6 位")).toBeInTheDocument()
    expect(screen.getByLabelText("邮箱")).toHaveFocus()
  })

  it("首次提交后修改输入会重新校验", () => {
    renderWithIntl(<LoginForm />)
    fireEvent.submit(getForm())
    expect(screen.getByText("请输入邮箱")).toBeInTheDocument()

    fill("tester@example.com", "123456")

    expect(screen.queryByText("请输入邮箱")).not.toBeInTheDocument()
    expect(screen.queryByText("请输入密码")).not.toBeInTheDocument()
  })

  it("只有密码错误时聚焦密码", () => {
    renderWithIntl(<LoginForm />)
    fireEvent.change(screen.getByLabelText("邮箱"), {
      target: { value: "tester@example.com" },
    })

    fireEvent.submit(getForm())

    expect(screen.getByText("请输入密码")).toBeInTheDocument()
    expect(screen.getByLabelText("密码")).toHaveFocus()
  })

  it("切换密码显隐不改变输入值", () => {
    renderWithIntl(<LoginForm />)
    const password = screen.getByLabelText("密码")
    fireEvent.change(password, { target: { value: "secret" } })

    expect(password).toHaveAttribute("type", "password")

    fireEvent.click(screen.getByRole("button", { name: "显示密码" }))
    expect(password).toHaveAttribute("type", "text")
    expect(password).toHaveValue("secret")

    fireEvent.click(screen.getByRole("button", { name: "隐藏密码" }))
    expect(password).toHaveAttribute("type", "password")
    expect(password).toHaveValue("secret")
  })

  it("合法提交显示 loading、记住邮箱并弹出成功 Toast，不落盘密码也不跳转", () => {
    const pushState = vi.spyOn(window.history, "pushState")
    const replaceState = vi.spyOn(window.history, "replaceState")
    renderWithIntl(<LoginForm />)
    fill("tester@example.com", "123456")
    fireEvent.click(screen.getByRole("checkbox", { name: "记住邮箱" }))

    fireEvent.submit(getForm())

    expect(screen.getByRole("button", { name: /正在登录/ })).toBeDisabled()
    expect(window.localStorage.getItem(REMEMBERED_EMAIL_KEY)).toBe("tester@example.com")

    act(() => {
      vi.advanceTimersByTime(SUBMIT_DELAY_MS)
    })

    expect(toast.success).toHaveBeenCalledWith("表单校验通过", {
      description: "认证服务尚未接入；接入后会进入工作台。",
    })
    // 规格要求 URL 不变；用 history 监听兜住“偷偷跳工作台”的改动。
    expect(window.location.pathname).toBe("/")
    expect(pushState).not.toHaveBeenCalled()
    expect(replaceState).not.toHaveBeenCalled()

    // 密码不落盘：本地只允许存在邮箱键，且任何值都不包含密码。
    expect(window.localStorage.length).toBe(1)
    expect(window.localStorage.key(0)).toBe(REMEMBERED_EMAIL_KEY)
    const storedValues = Array.from({ length: window.localStorage.length }, (_, index) =>
      window.localStorage.getItem(window.localStorage.key(index) ?? ""),
    )
    expect(storedValues.some((value) => value?.includes("123456"))).toBe(false)

    pushState.mockRestore()
    replaceState.mockRestore()
  })

  it("提交中重复点击不会产生第二个成功 Toast", () => {
    renderWithIntl(<LoginForm />)
    fill("tester@example.com", "123456")
    fireEvent.submit(getForm())

    fireEvent.submit(getForm())

    act(() => {
      vi.advanceTimersByTime(SUBMIT_DELAY_MS)
    })

    expect(toast.success).toHaveBeenCalledTimes(1)
  })

  it("成功后再次提交会重新校验并再次给出成功反馈", () => {
    renderWithIntl(<LoginForm />)
    fill("tester@example.com", "123456")
    fireEvent.submit(getForm())

    act(() => {
      vi.advanceTimersByTime(SUBMIT_DELAY_MS)
    })
    expect(toast.success).toHaveBeenCalledTimes(1)

    fireEvent.submit(getForm())
    act(() => {
      vi.advanceTimersByTime(SUBMIT_DELAY_MS)
    })

    expect(toast.success).toHaveBeenCalledTimes(2)
  })

  it("未勾选时立即清除已保存邮箱，校验失败也不会写回", () => {
    window.localStorage.setItem(REMEMBERED_EMAIL_KEY, "saved@example.com")
    renderWithIntl(<LoginForm />)

    expect(screen.getByLabelText("邮箱")).toHaveValue("saved@example.com")
    const remember = screen.getByRole("checkbox", { name: "记住邮箱" })
    expect(remember).toHaveAttribute("aria-checked", "true")

    fireEvent.click(remember)

    // 取消勾选即清除；当前输入保留，避免用户看到邮箱被一起清空。
    expect(window.localStorage.getItem(REMEMBERED_EMAIL_KEY)).toBeNull()
    expect(screen.getByLabelText("邮箱")).toHaveValue("saved@example.com")

    fireEvent.change(screen.getByLabelText("密码"), { target: { value: "12345" } })
    fireEvent.submit(getForm())
    expect(screen.getByText("密码至少 6 位")).toBeInTheDocument()
    expect(window.localStorage.getItem(REMEMBERED_EMAIL_KEY)).toBeNull()

    fireEvent.change(screen.getByLabelText("密码"), { target: { value: "123456" } })
    fireEvent.submit(getForm())
    act(() => {
      vi.advanceTimersByTime(SUBMIT_DELAY_MS)
    })

    expect(window.localStorage.getItem(REMEMBERED_EMAIL_KEY)).toBeNull()
  })

  it("卸载时清理未完成的提交定时器", () => {
    const { unmount } = renderWithIntl(<LoginForm />)
    fill("tester@example.com", "123456")
    fireEvent.submit(getForm())

    unmount()

    expect(vi.getTimerCount()).toBe(0)
  })

  it("服务端渲染不读取本地邮箱", () => {
    window.localStorage.setItem(REMEMBERED_EMAIL_KEY, "server@example.com")

    // 静态导出的首屏必须稳定；如果服务端快照读 localStorage，会与客户端 HTML 不一致。
    const html = renderToString(
      <IntlTestProvider>
        <LoginForm />
      </IntlTestProvider>,
    )

    expect(html).toContain("登录工作台")
    expect(html).not.toContain("server@example.com")
  })
})
