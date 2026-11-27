// 与 NodeJS.Platform 同构；本包不依赖 @types/node，浏览器侧消费时不会带入 Node 命名空间。
export type DesktopPlatform =
  | "aix"
  | "android"
  | "darwin"
  | "freebsd"
  | "haiku"
  | "linux"
  | "openbsd"
  | "sunos"
  | "win32"
  | "cygwin"
  | "netbsd"

/** 标题栏系统按钮符号色只接受这两个枚举；主进程负责映射到具体颜色。 */
export type TitleBarTheme = "light" | "dark"

/** preload 暴露给渲染进程的唯一桥接对象；新增字段必须先评估安全边界。 */
export interface DesktopBridge {
  platform: DesktopPlatform
  versions: {
    electron: string
    chrome: string
    node: string
  }
  setTitleBarTheme: (theme: TitleBarTheme) => void
}
