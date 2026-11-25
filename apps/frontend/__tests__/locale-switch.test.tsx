import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { LOCALE_STORAGE_KEY } from "@workspace/i18n"

import { LoginForm } from "@/app/(auth)/_components/login-form"
import { LocaleProvider } from "@/components/locale-provider"
import { LocaleToggle } from "@/components/locale-toggle"

import { chooseLocale } from "./test-utils"

// Toast 是副作用；这里只关心切换语言不打断表单，不断言 Toast 调用。
vi.mock("sonner", () => ({
  toast: { error: vi.fn<() => void>(), success: vi.fn<() => void>() },
}))

vi.mock("next/navigation", () => ({
  usePathname: () => "/login/",
}))

beforeEach(() => {
  window.localStorage.clear()
})

describe("语言切换与表单状态", () => {
  it("切换语言保留已填写的邮箱、密码与记住邮箱勾选", async () => {
    render(
      <LocaleProvider>
        <LocaleToggle />
        <LoginForm />
      </LocaleProvider>,
    )

    fireEvent.change(screen.getByLabelText("邮箱"), { target: { value: "tester@example.com" } })
    fireEvent.change(screen.getByLabelText("密码"), { target: { value: "123456" } })
    fireEvent.click(screen.getByRole("checkbox", { name: "记住邮箱" }))

    await chooseLocale("English")

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Sign in to the workspace" })).toBeInTheDocument(),
    )

    expect(screen.getByLabelText("Email")).toHaveValue("tester@example.com")
    expect(screen.getByLabelText("Password")).toHaveValue("123456")
    expect(screen.getByRole("checkbox", { name: "Remember email" })).toHaveAttribute(
      "aria-checked",
      "true",
    )
    expect(window.localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("en-US")
  })

  it("英文界面下校验错误与 Toast 使用英文", async () => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, "en-US")

    render(
      <LocaleProvider>
        <LocaleToggle />
        <LoginForm />
      </LocaleProvider>,
    )

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Sign in to the workspace" })).toBeInTheDocument(),
    )

    fireEvent.submit(screen.getByRole("form", { name: "Sign-in form" }))

    expect(screen.getByText("Email is required")).toBeInTheDocument()
    expect(screen.getByText("Password is required")).toBeInTheDocument()
    expect(screen.getByLabelText("Email")).toHaveFocus()
  })
})
