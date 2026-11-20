import { BrowserWindow, Menu, app, protocol, session, shell } from "electron"
import type { BrowserWindowConstructorOptions } from "electron"
import path from "node:path"
import { APP_URL, getAllowedOrigins, getRendererUrl } from "./config"
import { configureDevToolsShortcuts } from "./devtools"
import { configureNavigation } from "./navigation"
import { APP_SCHEME, createProtocolHandler } from "../protocol/protocol"
import type { BootstrapOptions, WaitForServerOptions } from "../types"

const WINDOW_TITLE = "接口测试用例辅助生成系统"

export function getWindowOptions(preloadPath: string): BrowserWindowConstructorOptions {
  return {
    width: 1280,
    height: 800,
    // 低于 800×600 时前端布局会被挤压到不可操作，窗口拖拽到此为止。
    minWidth: 800,
    minHeight: 600,
    show: false,
    title: WINDOW_TITLE,
    webPreferences: {
      preload: preloadPath,
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
    },
  }
}

/** 等待开发服务器可访问；轮询而不是启动 Next，避免与 Turbo 的开发进程重复。 */
export async function waitForServer(
  url: string,
  options: WaitForServerOptions = {},
): Promise<boolean> {
  const timeoutMs = options.timeoutMs ?? 30_000
  const intervalMs = options.intervalMs ?? 500
  const now = options.now ?? Date.now
  const sleep = options.sleep ?? ((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)))
  const fetchImpl = options.fetchImpl ?? fetch
  const deadline = now() + timeoutMs

  while (now() < deadline) {
    try {
      const response = await fetchImpl(url, { method: "GET" })
      if (response.ok) return true
    } catch {
      // 连接失败是预期状态，继续重试直到 deadline。
    }
    const remaining = deadline - now()
    if (remaining <= 0) break
    await sleep(Math.min(intervalMs, remaining))
  }
  return false
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

/** 超时时加载的本地诊断页；重试链接仍指向开发服务器地址。 */
export function createStartupErrorPage(targetUrl: string): string {
  const safeUrl = escapeHtml(targetUrl)
  const html = [
    "<!doctype html>",
    '<html lang="zh-CN"><meta charset="utf-8">',
    "<title>前端开发服务器未就绪</title>",
    "<body>",
    "<h1>前端开发服务器未就绪</h1>",
    `<p>无法连接 <code>${safeUrl}</code></p>`,
    "<p>请先运行 <code>pnpm --filter frontend dev</code>，或检查 ELECTRON_RENDERER_URL。</p>",
    `<p><a href="${safeUrl}">重试</a></p>`,
    "</body></html>",
  ].join("")
  return `data:text/html;charset=utf-8,${encodeURIComponent(html)}`
}

/** 启动桌面壳。main.ts 已先注册 app scheme；这里负责窗口、协议与生命周期。 */
export async function bootstrap(options: BootstrapOptions = {}): Promise<void> {
  if (!app.requestSingleInstanceLock()) {
    app.quit()
    return
  }

  const isPackaged = app.isPackaged
  const devUrl = process.env.ELECTRON_RENDERER_URL
  const rendererUrl = getRendererUrl({ isPackaged, devUrl })
  const allowedOrigins = getAllowedOrigins({ isPackaged, devUrl })
  const wait = options.waitForServer ?? waitForServer

  await app.whenReady()

  // 默认菜单带调试快捷键；打包态不能留入口，开发态改由 before-input-event 切换。
  Menu.setApplicationMenu(null)

  let devServerReady = true
  if (isPackaged) {
    const rendererRoot = path.join(app.getAppPath(), "renderer")
    const handler = createProtocolHandler({ rendererRoot })
    protocol.handle(APP_SCHEME, (request) => handler(request as Request))
  } else {
    devServerReady = await wait(rendererUrl)
  }

  const createWindow = () => {
    const win = new BrowserWindow(getWindowOptions(path.join(__dirname, "preload.cjs")))
    win.once("ready-to-show", () => win.show())
    configureNavigation(win.webContents, allowedOrigins, (url) => shell.openExternal(url))
    const target = isPackaged
      ? APP_URL
      : devServerReady
        ? rendererUrl
        : createStartupErrorPage(rendererUrl)
    void win.loadURL(target)
    // 仅开发态注册调试快捷键；打包态不注册、不自动打开。
    if (!isPackaged) configureDevToolsShortcuts(win.webContents)
    return win
  }

  let mainWindow = createWindow()

  app.on("second-instance", () => {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  })
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) mainWindow = createWindow()
  })
  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit()
  })
  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) =>
    callback(false),
  )
}
