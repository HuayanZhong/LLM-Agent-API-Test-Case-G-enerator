import { beforeEach, describe, expect, it, vi } from "vitest"

const electron = vi.hoisted(() => {
  const windows: Array<{
    options: Record<string, unknown>
    webContents: {
      setWindowOpenHandler: ReturnType<typeof vi.fn>
      on: ReturnType<typeof vi.fn>
    }
    once: ReturnType<typeof vi.fn>
    loadURL: ReturnType<typeof vi.fn>
    show: ReturnType<typeof vi.fn>
    focus: ReturnType<typeof vi.fn>
    isMinimized: ReturnType<typeof vi.fn>
    restore: ReturnType<typeof vi.fn>
  }> = []

  class MockBrowserWindow {
    static getAllWindows = () => windows
    options: Record<string, unknown>
    webContents = {
      setWindowOpenHandler:
        vi.fn<(handler: (details: { url: string }) => { action: "deny" }) => void>(),
      on: vi.fn<
        (event: string, listener: (event: { preventDefault(): void }, url: string) => void) => void
      >(),
    }
    once = vi.fn<(event: string, listener: () => void) => void>((event, listener) => {
      if (event === "ready-to-show") listener()
    })
    loadURL = vi.fn<(url: string) => Promise<void>>(async () => {})
    show = vi.fn<() => void>()
    focus = vi.fn<() => void>()
    isMinimized = vi.fn<() => boolean>(() => false)
    restore = vi.fn<() => void>()
    constructor(options: Record<string, unknown>) {
      this.options = options
      windows.push(this)
    }
  }

  const app = {
    isPackaged: false,
    requestSingleInstanceLock: vi.fn<() => boolean>(() => true),
    quit: vi.fn<() => void>(),
    whenReady: vi.fn<() => Promise<void>>(async () => {}),
    on: vi.fn<(event: string, listener: (...args: never[]) => void) => void>(),
    getAppPath: vi.fn<() => string>(() => "C:/tmp/app"),
  }
  const protocol = { handle: vi.fn<(scheme: string, handler: unknown) => void>() }
  const session = {
    defaultSession: { setPermissionRequestHandler: vi.fn<(handler: unknown) => void>() },
  }
  const shell = { openExternal: vi.fn<(url: string) => Promise<void>>(async () => {}) }

  return { app, protocol, session, shell, BrowserWindow: MockBrowserWindow, windows }
})

vi.mock("electron", () => ({
  app: electron.app,
  BrowserWindow: electron.BrowserWindow,
  protocol: electron.protocol,
  session: electron.session,
  shell: electron.shell,
}))

import {
  bootstrap,
  createStartupErrorPage,
  getWindowOptions,
  waitForServer,
} from "../src/bootstrap"

function decodedPage(dataUrl: string): string {
  return decodeURIComponent(dataUrl.slice(dataUrl.indexOf(",") + 1))
}

beforeEach(() => {
  vi.clearAllMocks()
  electron.windows.length = 0
  electron.app.isPackaged = false
  electron.app.requestSingleInstanceLock.mockReturnValue(true)
  electron.app.whenReady.mockResolvedValue(undefined)
  delete process.env.ELECTRON_RENDERER_URL
})

describe("waitForServer", () => {
  it("开发服务器稍晚就绪时持续重试并成功", async () => {
    let now = 0
    let calls = 0
    const fetchImpl = async () => {
      calls += 1
      if (calls < 3) throw new Error("not ready")
      return new Response("ok", { status: 200 })
    }
    const result = await waitForServer("http://localhost:3000", {
      timeoutMs: 20,
      intervalMs: 5,
      now: () => now,
      sleep: async (ms) => {
        now += ms
      },
      fetchImpl,
    })
    expect(result).toBe(true)
    expect(calls).toBe(3)
  })

  it("超时后返回 false", async () => {
    let now = 0
    const fetchImpl = async () => {
      throw new Error("not ready")
    }
    const result = await waitForServer("http://localhost:3000", {
      timeoutMs: 10,
      intervalMs: 5,
      now: () => now,
      sleep: async (ms) => {
        now += ms
      },
      fetchImpl,
    })
    expect(result).toBe(false)
  })
})

describe("createStartupErrorPage", () => {
  it("页面包含目标地址与重试入口", () => {
    const html = decodedPage(createStartupErrorPage("http://localhost:3000/"))
    expect(html).toContain("http://localhost:3000/")
    expect(html).toContain("重试")
  })

  it("转义目标地址中的 HTML", () => {
    const html = decodedPage(createStartupErrorPage('http://x/"><script>alert(1)</script>'))
    expect(html).not.toContain("<script>")
  })
})

describe("getWindowOptions", () => {
  it("固定安全 webPreferences 与初始隐藏", () => {
    const options = getWindowOptions("C:/tmp/preload.cjs")
    expect(options).toMatchObject({
      show: false,
      title: "接口测试用例辅助生成系统",
      webPreferences: {
        preload: "C:/tmp/preload.cjs",
        sandbox: true,
        contextIsolation: true,
        nodeIntegration: false,
        webSecurity: true,
      },
    })
  })
})

describe("bootstrap", () => {
  it("拿不到单实例锁时退出且不创建窗口", async () => {
    electron.app.requestSingleInstanceLock.mockReturnValue(false)
    await bootstrap({ waitForServer: async () => true })
    expect(electron.app.quit).toHaveBeenCalled()
    expect(electron.app.whenReady).not.toHaveBeenCalled()
    expect(electron.windows).toHaveLength(0)
  })

  it("开发态就绪后加载开发服务器地址", async () => {
    await bootstrap({ waitForServer: async () => true })
    const win = electron.windows[0]
    expect(win?.loadURL).toHaveBeenCalledWith("http://localhost:3000")
    expect(win?.show).toHaveBeenCalled()
    expect(electron.session.defaultSession.setPermissionRequestHandler).toHaveBeenCalled()
  })

  it("开发服务器超时后加载错误页", async () => {
    await bootstrap({ waitForServer: async () => false })
    const url = electron.windows[0]?.loadURL.mock.calls[0]?.[0] as string
    expect(url.startsWith("data:text/html")).toBe(true)
    expect(decodedPage(url)).toContain("http://localhost:3000")
  })

  it("打包态注册 app:// 协议并加载 bundle", async () => {
    electron.app.isPackaged = true
    const wait = vi.fn<() => Promise<boolean>>(async () => true)
    await bootstrap({ waitForServer: wait })
    expect(electron.protocol.handle).toHaveBeenCalledWith("app", expect.any(Function))
    expect(electron.windows[0]?.loadURL).toHaveBeenCalledWith("app://bundle/")
    expect(wait).not.toHaveBeenCalled()
  })

  it("第二次启动聚焦已有窗口", async () => {
    await bootstrap({ waitForServer: async () => true })
    const handler = electron.app.on.mock.calls.find(([event]) => event === "second-instance")?.[1]
    handler?.()
    expect(electron.windows[0]?.focus).toHaveBeenCalled()
  })

  it("拒绝渲染进程权限请求", async () => {
    await bootstrap({ waitForServer: async () => true })
    const handler = electron.session.defaultSession.setPermissionRequestHandler.mock
      .calls[0]?.[0] as (
      wc: unknown,
      permission: string,
      callback: (granted: boolean) => void,
    ) => void
    const callback = vi.fn<(granted: boolean) => void>()
    handler({}, "geolocation", callback)
    expect(callback).toHaveBeenCalledWith(false)
  })

  it("窗口全部关闭时退出（非 macOS）", async () => {
    await bootstrap({ waitForServer: async () => true })
    const handler = electron.app.on.mock.calls.find(([event]) => event === "window-all-closed")?.[1]
    handler?.()
    expect(electron.app.quit).toHaveBeenCalled()
  })

  it("activate 且没有窗口时重建窗口", async () => {
    await bootstrap({ waitForServer: async () => true })
    electron.windows.length = 0
    const handler = electron.app.on.mock.calls.find(([event]) => event === "activate")?.[1]
    handler?.()
    expect(electron.windows).toHaveLength(1)
  })
})
