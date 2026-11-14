import { promises as fs } from "node:fs"
import { statSync } from "node:fs"
import path from "node:path"

export const APP_SCHEME = "app"
export const APP_HOST = "bundle"

// Next 静态导出含内联 hydration 脚本，因此 script-src 先允许 unsafe-inline。
export const HTML_CSP =
  "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; " +
  "img-src 'self' data:; font-src 'self' data:; object-src 'none'; base-uri 'self'; " +
  "connect-src 'self' http://localhost:4000 http://127.0.0.1:4000"

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".htm": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".zip": "application/zip",
}

export interface ProtocolHandlerOptions {
  rendererRoot: string
  // 测试可注入失败读取；生产默认走 fs.readFile（Electron 已 patch asar）。
  readFile?: (filePath: string) => Promise<Uint8Array>
}

export function getMimeType(filePath: string): string {
  return MIME_TYPES[path.extname(filePath).toLowerCase()] ?? "application/octet-stream"
}

function isInside(root: string, target: string): boolean {
  return target === root || target.startsWith(root + path.sep)
}

function isFile(target: string): boolean {
  try {
    return statSync(target).isFile()
  } catch {
    return false
  }
}

/**
 * 把 URL pathname 映射到 renderer 根内的文件。
 * 顺序：精确文件 -> 目录 index.html -> 同名 .html；任何越界或非法编码返回 null。
 */
export function resolveAssetPath(rendererRoot: string, pathname: string): string | null {
  let decoded: string
  try {
    decoded = decodeURIComponent(pathname)
  } catch {
    return null
  }
  if (decoded.includes("\0")) return null

  const root = path.resolve(rendererRoot)
  const relative = decoded.replace(/^\/+/, "")
  const base = path.resolve(root, relative)
  if (!isInside(root, base)) return null

  const candidates =
    relative === ""
      ? [path.join(root, "index.html")]
      : [base, path.join(base, "index.html"), `${base}.html`]

  for (const candidate of candidates) {
    if (isInside(root, candidate) && isFile(candidate)) return candidate
  }
  return null
}

function getCacheControl(filePath: string, pathname: string): string {
  if (pathname.startsWith("/_next/static/")) return "public, max-age=31536000, immutable"
  if (filePath.endsWith(".html")) return "no-cache"
  return "public, max-age=3600"
}

function buildHeaders(filePath: string, pathname: string): Record<string, string> {
  const headers: Record<string, string> = {
    "content-type": getMimeType(filePath),
    "cache-control": getCacheControl(filePath, pathname),
  }
  if (filePath.endsWith(".html")) headers["content-security-policy"] = HTML_CSP
  return headers
}

async function notFound(
  root: string,
  readFile: (filePath: string) => Promise<Uint8Array>,
): Promise<Response> {
  const page = resolveAssetPath(root, "/404.html")
  if (page) {
    try {
      const body = await readFile(page)
      return new Response(body, { status: 404, headers: buildHeaders(page, "/404.html") })
    } catch {
      // 回退到纯文本，保证协议 handler 永远有响应。
    }
  }
  return new Response("Not Found", {
    status: 404,
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-cache" },
  })
}

/** 生成给 Electron protocol.handle 使用的处理器；不依赖 electron，便于单测。 */
export function createProtocolHandler({
  rendererRoot,
  readFile = fs.readFile,
}: ProtocolHandlerOptions) {
  const root = path.resolve(rendererRoot)
  return async (request: Request): Promise<Response> => {
    let url: URL
    try {
      url = new URL(request.url)
    } catch {
      return notFound(root, readFile)
    }
    if (url.protocol !== `${APP_SCHEME}:` || url.host !== APP_HOST) return notFound(root, readFile)

    const filePath = resolveAssetPath(root, url.pathname)
    if (!filePath) return notFound(root, readFile)

    try {
      const body = await readFile(filePath)
      const headers = buildHeaders(filePath, url.pathname)
      if (request.method === "HEAD") return new Response(null, { status: 200, headers })
      return new Response(body, { status: 200, headers })
    } catch {
      return notFound(root, readFile)
    }
  }
}
