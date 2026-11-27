import { act, render, screen, waitFor } from "@testing-library/react"
import { useTranslations } from "next-intl"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { LOCALE_STORAGE_KEY } from "@workspace/i18n"

import { LocaleProvider } from "@/components/layout/locale-provider"

const route = vi.hoisted(() => ({ pathname: "/login/" }))

vi.mock("next/navigation", () => ({
  usePathname: () => route.pathname,
}))

function Probe() {
  const t = useTranslations("auth.login")
  return <p>{t("title")}</p>
}

beforeEach(() => {
  window.localStorage.clear()
  route.pathname = "/login/"
  document.title = ""
  document.documentElement.lang = ""
  document.head.querySelector('meta[name="description"]')?.remove()
  const description = document.createElement("meta")
  description.setAttribute("name", "description")
  document.head.appendChild(description)
})

describe("LocaleProvider", () => {
  it("没有偏好时按中文渲染，并同步文档语言与标题", async () => {
    render(
      <LocaleProvider>
        <Probe />
      </LocaleProvider>,
    )

    expect(screen.getByText("登录工作台")).toBeInTheDocument()
    await waitFor(() => expect(document.documentElement.lang).toBe("zh-CN"))
    expect(document.title).toBe("登录 · 接口测试用例辅助生成系统")
    expect(document.querySelector('meta[name="description"]')?.getAttribute("content")).toBe(
      "使用邮箱登录工作台，管理接口测试用例与复验。",
    )
  })

  it("读取已保存的英文偏好并保持存储值", async () => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, "en-US")

    render(
      <LocaleProvider>
        <Probe />
      </LocaleProvider>,
    )

    await waitFor(() => expect(screen.getByText("Sign in to the workspace")).toBeInTheDocument())
    expect(document.documentElement.lang).toBe("en-US")
    expect(document.title).toBe("Sign in · API Test Case Assistant")
    expect(document.querySelector('meta[name="description"]')?.getAttribute("content")).toBe(
      "Sign in with your email to manage API test cases and verification.",
    )
    // 首帧固定中文、挂载后才读偏好；读到的值不能被默认值覆盖回去。
    expect(window.localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("en-US")
  })

  it("非法偏好回落中文", async () => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, "zh-TW")

    render(
      <LocaleProvider>
        <Probe />
      </LocaleProvider>,
    )

    await waitFor(() => expect(screen.getByText("登录工作台")).toBeInTheDocument())
    expect(document.documentElement.lang).toBe("zh-CN")
  })

  it("注册页标题按路由切换", async () => {
    route.pathname = "/register/"
    window.localStorage.setItem(LOCALE_STORAGE_KEY, "en-US")

    render(
      <LocaleProvider>
        <Probe />
      </LocaleProvider>,
    )

    await waitFor(() => expect(document.title).toBe("Create account · API Test Case Assistant"))
  })

  it("其他窗口修改偏好时同步语言", async () => {
    render(
      <LocaleProvider>
        <Probe />
      </LocaleProvider>,
    )

    act(() => {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, "en-US")
      window.dispatchEvent(
        new StorageEvent("storage", { key: LOCALE_STORAGE_KEY, newValue: "en-US" }),
      )
    })

    await waitFor(() => expect(screen.getByText("Sign in to the workspace")).toBeInTheDocument())
    expect(document.documentElement.lang).toBe("en-US")
  })
})
