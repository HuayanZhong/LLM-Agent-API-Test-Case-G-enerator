import type { DesktopBridge } from "@workspace/types"

// preload 通过 contextBridge 暴露的唯一全局对象；这里只声明契约，不参与运行时。
declare global {
  interface Window {
    desktop: DesktopBridge
  }
}
