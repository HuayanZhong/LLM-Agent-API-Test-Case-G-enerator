import { getNavigationOrigin } from "./config"

/** 只有 http(s) 才交给系统浏览器；app://、file://、mailto 等不按外链处理。 */
export function isExternalHttpUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl)
    return parsed.protocol === "http:" || parsed.protocol === "https:"
  } catch {
    return false
  }
}

/** 导航目标必须解析出受支持的 origin，且命中白名单。 */
export function isAllowedNavigation(rawUrl: string, allowedOrigins: string[]): boolean {
  const origin = getNavigationOrigin(rawUrl)
  return origin !== null && allowedOrigins.includes(origin)
}

export interface WebContentsLike {
  setWindowOpenHandler(handler: (details: { url: string }) => { action: "deny" }): void
  on(
    event: "will-navigate",
    listener: (event: { preventDefault(): void }, url: string) => void,
  ): void
}

/** 统一挂载新窗口与页面内导航策略：应用内放行，http(s) 交给系统浏览器，其余拦截。 */
export function configureNavigation(
  webContents: WebContentsLike,
  allowedOrigins: string[],
  openExternal: (url: string) => void | Promise<void>,
): void {
  webContents.setWindowOpenHandler(({ url }) => {
    if (isExternalHttpUrl(url)) void openExternal(url)
    return { action: "deny" }
  })

  webContents.on("will-navigate", (event, url) => {
    if (isAllowedNavigation(url, allowedOrigins)) return
    event.preventDefault()
    if (isExternalHttpUrl(url)) void openExternal(url)
  })
}
