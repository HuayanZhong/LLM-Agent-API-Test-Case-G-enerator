import { BrowserWindow, ipcMain } from "electron"

import { isTitleBarTheme, TITLE_BAR_CHANNEL, type TitleBarTheme } from "../titlebar-contract"

/** 与前端 `--app-titlebar-height` 对齐；WCO 覆盖层高度由 OS 按此绘制。 */
export const TITLE_BAR_HEIGHT = 40

// 对应 globals.css 的 --foreground：浅色主题深色符号、深色主题浅色符号。
const SYMBOL_COLORS = {
  light: "#0a0a0a",
  dark: "#fafafa",
} satisfies Record<TitleBarTheme, string>

export interface TitleBarOverlayTheme {
  color: string
  symbolColor: string
  height: number
}

/**
 * WCO 覆盖层配置：透明底让页面双栏背景直接透出，避免顶部接缝。
 * 系统按钮仍由 Windows 绘制，保留 Snap Layouts 与双击最大化。
 */
export function getTitleBarOverlay(theme: TitleBarTheme): TitleBarOverlayTheme {
  return {
    color: "rgba(0, 0, 0, 0)",
    symbolColor: SYMBOL_COLORS[theme],
    height: TITLE_BAR_HEIGHT,
  }
}

/**
 * 只注册一条标题栏主题通道。
 * 非 Windows、参数非法或窗口已销毁时静默忽略；不把原生窗口配置开放给渲染进程。
 */
export function registerTitleBarIpc(platform: NodeJS.Platform = process.platform): void {
  ipcMain.on(TITLE_BAR_CHANNEL, (event, theme: unknown) => {
    if (platform !== "win32" || !isTitleBarTheme(theme)) {
      return
    }

    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win || win.isDestroyed()) {
      return
    }

    win.setTitleBarOverlay(getTitleBarOverlay(theme))
  })
}
