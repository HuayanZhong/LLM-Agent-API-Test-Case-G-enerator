/** 主窗口渲染目标的地址配置；打包态走 app://，开发态走 devUrl。 */
export interface RendererOptions {
  isPackaged: boolean
  devUrl?: string
}

/** waitForServer 的可注入依赖；测试用它替换时钟、sleep 与 fetch。 */
export interface WaitForServerOptions {
  timeoutMs?: number
  intervalMs?: number
  now?: () => number
  sleep?: (ms: number) => Promise<void>
  fetchImpl?: typeof fetch
}

type WaitForServer = (url: string, options?: WaitForServerOptions) => Promise<boolean>

/** bootstrap 的测试注入点；生产路径传入默认实现。 */
export interface BootstrapOptions {
  waitForServer?: WaitForServer
}

/** app:// 协议处理器的输入；rendererRoot 之外的文件一律拒绝。 */
export interface ProtocolHandlerOptions {
  rendererRoot: string
  readFile?: (filePath: string) => Promise<Uint8Array>
}

/** 导航策略需要的最小 webContents 契约，避免测试依赖 Electron 运行时。 */
export interface WebContentsLike {
  setWindowOpenHandler(handler: (details: { url: string }) => { action: "deny" }): void
  on(
    event: "will-navigate",
    listener: (event: { preventDefault(): void }, url: string) => void,
  ): void
}

/** before-input-event 中与 DevTools 快捷键相关的字段。 */
export interface DevToolsInput {
  type: string
  key: string
  control: boolean
  shift: boolean
}

/** DevTools 快捷键需要的最小 webContents 契约。 */
export interface DevToolsShortcutTarget {
  on(
    event: "before-input-event",
    listener: (event: { preventDefault(): void }, input: DevToolsInput) => void,
  ): void
  toggleDevTools(): void
}
