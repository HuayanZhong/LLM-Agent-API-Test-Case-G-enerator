import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { useTranslations } from "next-intl"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { LOCALE_STORAGE_KEY } from "@workspace/i18n"

import { LocaleProvider } from "@/components/locale-provider"
import { LocaleToggle } from "@/components/locale-toggle"

import { chooseLocale } from "./test-utils"

vi.mock("next/navigation", () => ({
  usePathname: () => "/login/",
}))

function Probe() {
  const t = useTranslations("auth.login")
  return <p>{t("title")}</p>
}

beforeEach(() => {
  window.localStorage.clear()
  document.documentElement.lang = ""
})

describe("LocaleToggle", () => {
  it("下拉菜单标记当前语言", async () => {
    render(
      <LocaleProvider>
        <LocaleToggle />
        <Probe />
      </LocaleProvider>,
    )

    const trigger = screen.getByRole("button", { name: /切换语言/ })
    fireEvent.pointerDown(trigger, { button: 0, pointerType: "mouse" })

    const zhItem = await screen.findByRole("menuitemradio", { name: "中文" })
    expect(zhItem).toHaveAttribute("aria-checked", "true")
    expect(screen.getByRole("menuitemradio", { name: "English" })).toHaveAttribute(
      "aria-checked",
      "false",
    )
  })

  it("选择英文后切换文案、文档语言并写入偏好", async () => {
    render(
      <LocaleProvider>
        <LocaleToggle />
        <Probe />
      </LocaleProvider>,
    )

    await chooseLocale("English")

    await waitFor(() => expect(screen.getByText("Sign in to the workspace")).toBeInTheDocument())
    expect(document.documentElement.lang).toBe("en-US")
    expect(window.localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("en-US")
    expect(screen.getByRole("button", { name: /Switch language/ })).toBeInTheDocument()
    // 切换语言不改变 URL。
    expect(window.location.pathname).toBe("/")
  })
})
