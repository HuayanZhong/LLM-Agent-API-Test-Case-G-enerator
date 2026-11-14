import { describe, expect, it, vi } from "vitest"

describe("preload", () => {
  it("只暴露 platform 与 versions", async () => {
    const exposeInMainWorld = vi.fn<(name: string, payload: unknown) => void>()
    vi.resetModules()
    vi.doMock("electron", () => ({ contextBridge: { exposeInMainWorld } }))

    await import("../src/preload")

    expect(exposeInMainWorld).toHaveBeenCalledTimes(1)
    const [name, payload] = exposeInMainWorld.mock.calls[0] as [string, Record<string, unknown>]
    expect(name).toBe("desktop")
    expect(Object.keys(payload).sort()).toEqual(["platform", "versions"])
    expect(payload.platform).toBe(process.platform)
    expect(Object.keys(payload.versions as Record<string, unknown>).sort()).toEqual([
      "chrome",
      "electron",
      "node",
    ])
  })
})
