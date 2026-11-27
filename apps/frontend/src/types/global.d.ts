import type { DesktopBridge } from "@workspace/types"

// preload 只在 Electron 桌面壳里注入 desktop；浏览器预览下为 undefined，调用方必须可选链。
declare global {
  interface Window {
    desktop?: DesktopBridge
  }
}
