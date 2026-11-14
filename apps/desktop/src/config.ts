export const DEFAULT_DEV_RENDERER_URL = "http://localhost:3000"
export const APP_ORIGIN = "app://bundle"
export const APP_URL = "app://bundle/"

export interface RendererOptions {
  isPackaged: boolean
  devUrl?: string
}

/**
 * URL 的稳定 origin。
 * app:// 是非 special scheme，Node 的 URL.origin 会返回 "null"，这里按 host 还原。
 */
export function getNavigationOrigin(rawUrl: string): string | null {
  try {
    const parsed = new URL(rawUrl)
    if (parsed.protocol === "app:") return `app://${parsed.host}`
    if (parsed.protocol === "http:" || parsed.protocol === "https:") return parsed.origin
    return null
  } catch {
    return null
  }
}

/** 打包态固定 app://；开发态用 devUrl，无效时回退 3000，避免空白窗口。 */
export function getRendererUrl({ isPackaged, devUrl }: RendererOptions): string {
  if (isPackaged) return APP_URL
  const candidate = devUrl?.trim()
  if (candidate && getNavigationOrigin(candidate)) return candidate
  return DEFAULT_DEV_RENDERER_URL
}

/** 导航白名单：打包态只认 app://bundle，开发态只认开发服务器 origin。 */
export function getAllowedOrigins(options: RendererOptions): string[] {
  if (options.isPackaged) return [APP_ORIGIN]
  const origin = getNavigationOrigin(getRendererUrl(options))
  return origin ? [origin] : []
}
