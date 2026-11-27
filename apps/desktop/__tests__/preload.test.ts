import { describe, expect, it, vi } from "vitest"

import type { DesktopBridge } from "@workspace/types"

describe("preload", () => {
  it("只暴露 platform、versions 与标题栏主题入口", async () => {
    const exposeInMainWorld = vi.fn<(name: string, payload: unknown) => void>()
    const send = vi.fn<(channel: string, theme: unknown) => void>()
    vi.resetModules()
    vi.doMock("electron", () => ({
      contextBridge: { exposeInMainWorld },
      ipcRenderer: { send },
    }))

    await import("../src/preload")

    expect(exposeInMainWorld).toHaveBeenCalledTimes(1)
    const [name, payload] = exposeInMainWorld.mock.calls[0] as [string, DesktopBridge]
    expect(name).toBe("desktop")
    expect(Object.keys(payload).sort()).toEqual(["platform", "setTitleBarTheme", "versions"])
    expect(payload.platform).toBe(process.platform)
    expect(Object.keys(payload.versions).sort()).toEqual(["chrome", "electron", "node"])

    payload.setTitleBarTheme("dark")
    expect(send).toHaveBeenCalledWith("titlebar:set-theme", "dark")
  })
})
