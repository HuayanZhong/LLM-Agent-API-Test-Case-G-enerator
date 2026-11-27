import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { RegisterForm } from "@/app/(auth)/_components/forms/register-form"
import { CODE_RESEND_SECONDS } from "@/app/(auth)/_lib/auth-constants"
import { LocaleProvider } from "@/components/layout/locale-provider"
import { LocaleToggle } from "@/components/controls/locale-toggle"

import { LOCALE_STORAGE_KEY } from "@workspace/i18n"

const toast = vi.hoisted(() => ({
  error: vi.fn<(message: string, options?: unknown) => void>(),
  success: vi.fn<(message: string, options?: unknown) => void>(),
}))

vi.mock("sonner", () => ({ toast }))

vi.mock("next/navigation", () => ({
  usePathname: () => "/register/",
}))

beforeEach(() => {
  window.localStorage.clear()
  toast.error.mockClear()
  toast.success.mockClear()
})

describe("注册页英文界面", () => {
  it("字段、按钮与倒计时跟随语言，Toast 使用英文", async () => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, "en-US")

    render(
      <LocaleProvider>
        <LocaleToggle />
        <RegisterForm />
      </LocaleProvider>,
    )

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Create your workspace account" }),
      ).toBeInTheDocument(),
    )

    expect(screen.getByLabelText("Email")).toBeInTheDocument()
    expect(screen.getByLabelText("Set password")).toBeInTheDocument()
    expect(screen.getByLabelText("Verification code")).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "tester@example.com" },
    })
    act(() => {
      screen.getByRole("button", { name: "Send code" }).click()
    })

    expect(toast.success).toHaveBeenCalledWith("Verification code sent (demo)", expect.any(Object))
    expect(screen.getByRole("button", { name: `Resend in ${CODE_RESEND_SECONDS}s` })).toBeDisabled()
  })

  it("英文界面下表单级校验错误为英文", async () => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, "en-US")

    render(
      <LocaleProvider>
        <RegisterForm />
      </LocaleProvider>,
    )

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Create your workspace account" }),
      ).toBeInTheDocument(),
    )

    fireEvent.submit(screen.getByRole("form", { name: "Registration form" }))

    expect(screen.getByText("Email is required")).toBeInTheDocument()
    expect(screen.getByText("Password is required")).toBeInTheDocument()
    expect(screen.getByText("Verification code is required")).toBeInTheDocument()
    expect(toast.error).toHaveBeenCalledWith("Check your registration details", expect.any(Object))
  })
})
