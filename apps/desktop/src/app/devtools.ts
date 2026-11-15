import type { DevToolsInput, DevToolsShortcutTarget } from "../types"

// 精确匹配 F12 或 Ctrl+Shift+I；其余组合交给页面，避免抢输入。
function isToggleKey(input: DevToolsInput): boolean {
  if (input.key === "F12") return true
  return input.key.toLowerCase() === "i" && input.control && input.shift
}

/** 开发态绑定 DevTools 切换键；调用方只在未打包时注册，打包态不注册。 */
export function configureDevToolsShortcuts(webContents: DevToolsShortcutTarget): void {
  webContents.on("before-input-event", (event, input) => {
    if (input.type !== "keyDown" || !isToggleKey(input)) return
    event.preventDefault()
    webContents.toggleDevTools()
  })
}
