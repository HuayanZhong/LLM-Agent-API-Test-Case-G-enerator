import { beforeEach, describe, expect, it, vi } from "vitest"

const electron = vi.hoisted(() => {
  const listeners: Array<(event: { sender: unknown }, theme: unknown) => void> = []
  const setTitleBarOverlay = vi.fn<(options: unknown) => void>()
  const win = {
    isDestroyed: vi.fn<() => boolean>(() => false),
    setTitleBarOverlay,
  }
  const ipcMain = {
    on: vi.fn<
      (channel: string, listener: (event: { sender: unknown }, theme: unknown) => void) => void
    >((_channel, listener) => {
      listeners.push(listener)
    }),
  }
  const fromWebContents = vi.fn<(sender: unknown) => typeof win | null>(() => win)

  return { listeners, setTitleBarOverlay, win, ipcMain, fromWebContents }
})

vi.mock("electron", () => ({
  ipcMain: electron.ipcMain,
  BrowserWindow: { fromWebContents: electron.fromWebContents },
}))

import { getTitleBarOverlay, registerTitleBarIpc, TITLE_BAR_HEIGHT } from "../src/app/titlebar"

beforeEach(() => {
  electron.listeners.length = 0
  electron.ipcMain.on.mockClear()
  electron.fromWebContents.mockReset()
  electron.fromWebContents.mockReturnValue(electron.win)
  electron.win.isDestroyed.mockReturnValue(false)
  electron.setTitleBarOverlay.mockClear()
})

function dispatch(theme: unknown) {
  const listener = electron.listeners.at(-1)
  listener?.({ sender: {} }, theme)
}

describe("getTitleBarOverlay", () => {
  it("透明底与 40 高度，两种主题各用一套符号色", () => {
    expect(getTitleBarOverlay("light")).toEqual({
      color: "rgba(0, 0, 0, 0)",
      symbolColor: "#0a0a0a",
      height: TITLE_BAR_HEIGHT,
    })
    expect(getTitleBarOverlay("dark")).toEqual({
      color: "rgba(0, 0, 0, 0)",
      symbolColor: "#fafafa",
      height: TITLE_BAR_HEIGHT,
    })
  })
})

describe("registerTitleBarIpc", () => {
  it("Windows 下注册通道并按主题更新系统按钮符号色", () => {
    registerTitleBarIpc("win32")

    expect(electron.ipcMain.on).toHaveBeenCalledWith("titlebar:set-theme", expect.any(Function))

    dispatch("dark")

    expect(electron.fromWebContents).toHaveBeenCalledTimes(1)
    expect(electron.setTitleBarOverlay).toHaveBeenCalledWith(getTitleBarOverlay("dark"))
  })

  it("非法主题被忽略", () => {
    registerTitleBarIpc("win32")

    dispatch("system")
    dispatch(null)
    dispatch({ theme: "dark" })

    expect(electron.setTitleBarOverlay).not.toHaveBeenCalled()
  })

  it("非 Windows 平台忽略消息", () => {
    registerTitleBarIpc("darwin")

    dispatch("dark")

    expect(electron.setTitleBarOverlay).not.toHaveBeenCalled()
  })

  it("找不到窗口或窗口已销毁时忽略", () => {
    registerTitleBarIpc("win32")

    electron.fromWebContents.mockReturnValueOnce(null)
    dispatch("dark")
    expect(electron.setTitleBarOverlay).not.toHaveBeenCalled()

    electron.win.isDestroyed.mockReturnValueOnce(true)
    dispatch("dark")
    expect(electron.setTitleBarOverlay).not.toHaveBeenCalled()
  })
})
