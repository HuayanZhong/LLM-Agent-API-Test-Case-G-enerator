import { render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import type { DesktopBridge } from "@workspace/types"

import { AppTitlebar } from "@/components/layout/app-titlebar"

const theme = vi.hoisted(() => ({
  resolvedTheme: "light" as string | undefined,
}))

vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: theme.resolvedTheme }),
}))

vi.mock("@/components/controls/locale-toggle", () => ({
  LocaleToggle: () => <div data-testid="locale-toggle" />,
}))

vi.mock("@/components/controls/theme-toggle", () => ({
  ThemeToggle: () => <div data-testid="theme-toggle" />,
}))

function installDesktopBridge(setTitleBarTheme: DesktopBridge["setTitleBarTheme"]) {
  Object.defineProperty(window, "desktop", {
    configurable: true,
    writable: true,
    value: {
      platform: "win32",
      versions: { electron: "45", chrome: "1", node: "24" },
      setTitleBarTheme,
    } satisfies DesktopBridge,
  })
}

beforeEach(() => {
  theme.resolvedTheme = "light"
})

afterEach(() => {
  // 浏览器预览没有桌面桥；测试之间必须清掉，避免串味。
  delete (window as unknown as Record<string, unknown>).desktop
})

describe("AppTitlebar", () => {
  it("渲染可拖拽的透明标题栏与两个切换入口，不显示标题或图标", () => {
    render(<AppTitlebar />)

    const titlebar = screen.getByTestId("app-titlebar")
    expect(titlebar).toHaveClass("[-webkit-app-region:drag]")
    expect(screen.getByTestId("locale-toggle")).toBeInTheDocument()
    expect(screen.getByTestId("theme-toggle")).toBeInTheDocument()
    // 切换控件必须取消拖拽，否则点击会被窗口拖动吞掉。
    expect(screen.getByTestId("locale-toggle").parentElement).toHaveClass(
      "[-webkit-app-region:no-drag]",
    )
    expect(screen.queryByText("接口测试用例辅助生成系统")).not.toBeInTheDocument()
  })

  it("主题解析后同步系统按钮符号色", () => {
    const setTitleBarTheme = vi.fn<DesktopBridge["setTitleBarTheme"]>()
    installDesktopBridge(setTitleBarTheme)

    render(<AppTitlebar />)

    expect(setTitleBarTheme).toHaveBeenCalledWith("light")
  })

  it("深色主题同步 dark", () => {
    theme.resolvedTheme = "dark"
    const setTitleBarTheme = vi.fn<DesktopBridge["setTitleBarTheme"]>()
    installDesktopBridge(setTitleBarTheme)

    render(<AppTitlebar />)

    expect(setTitleBarTheme).toHaveBeenCalledWith("dark")
  })

  it("浏览器预览没有桌面桥时不报错", () => {
    expect(() => render(<AppTitlebar />)).not.toThrow()
  })
})
