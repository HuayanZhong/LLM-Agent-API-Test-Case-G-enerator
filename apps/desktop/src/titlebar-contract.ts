import type { TitleBarTheme } from "@workspace/types"

/** 主进程与 preload 共用的运行时常量；放在独立模块里避免 preload 拉到主进程代码。 */
export const TITLE_BAR_CHANNEL = "titlebar:set-theme"

// 主题类型只在共享包定义一次；这里转发给主进程的覆盖层模块使用。
export type { TitleBarTheme }

/** IPC 边界的两端都复用同一守卫，避免把主题字面量散落进两个进程。 */
export function isTitleBarTheme(value: unknown): value is TitleBarTheme {
  return value === "light" || value === "dark"
}
