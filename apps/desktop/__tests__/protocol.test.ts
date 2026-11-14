import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { HTML_CSP, createProtocolHandler, getMimeType, resolveAssetPath } from "../src/protocol"

let root = ""

async function write(relativePath: string, content: string) {
  const target = path.join(root, relativePath)
  await mkdir(path.dirname(target), { recursive: true })
  await writeFile(target, content, "utf-8")
}

beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), "desktop-protocol-"))
  await write("index.html", "<h1>home</h1>")
  await write("404.html", "<h1>missing</h1>")
  await write("report/index.html", "<h1>report</h1>")
  await write("legacy.html", "<h1>legacy</h1>")
  await write("_next/static/chunk.js", "console.log('chunk')")
  await write("font.woff2", "not-really-a-font")
})

afterEach(async () => {
  await rm(root, { recursive: true, force: true })
})

describe("resolveAssetPath", () => {
  it("根路径映射 index.html", () => {
    expect(resolveAssetPath(root, "/")).toBe(path.join(root, "index.html"))
  })

  it("trailing slash 路由映射到目录 index.html", () => {
    expect(resolveAssetPath(root, "/report/")).toBe(path.join(root, "report", "index.html"))
  })

  it("无 trailing slash 时回退到 .html", () => {
    expect(resolveAssetPath(root, "/legacy")).toBe(path.join(root, "legacy.html"))
  })

  it("静态资源按精确路径命中", () => {
    expect(resolveAssetPath(root, "/_next/static/chunk.js")).toBe(
      path.join(root, "_next", "static", "chunk.js"),
    )
  })

  it("未知路径返回 null", () => {
    expect(resolveAssetPath(root, "/missing/")).toBeNull()
  })

  it("拒绝 ..、编码穿越与空字节", () => {
    expect(resolveAssetPath(root, "/../secret")).toBeNull()
    expect(resolveAssetPath(root, "/%2e%2e/secret")).toBeNull()
    expect(resolveAssetPath(root, "/%00secret")).toBeNull()
  })

  it("拒绝无法解码的 URL 编码", () => {
    expect(resolveAssetPath(root, "/%E0%A4%A")).toBeNull()
  })
})

describe("getMimeType", () => {
  it("返回常见静态资源类型", () => {
    expect(getMimeType("index.html")).toContain("text/html")
    expect(getMimeType("chunk.js")).toContain("text/javascript")
    expect(getMimeType("style.css")).toContain("text/css")
    expect(getMimeType("data.json")).toContain("application/json")
    expect(getMimeType("font.woff2")).toBe("font/woff2")
    expect(getMimeType("unknown.bin")).toBe("application/octet-stream")
  })
})

describe("createProtocolHandler", () => {
  const handler = () => createProtocolHandler({ rendererRoot: root })

  it("返回首页并带 CSP 与 no-cache", async () => {
    const response = await handler()(new Request("app://bundle/"))
    expect(response.status).toBe(200)
    expect(response.headers.get("content-type")).toContain("text/html")
    expect(response.headers.get("content-security-policy")).toBe(HTML_CSP)
    expect(response.headers.get("cache-control")).toBe("no-cache")
    expect(await response.text()).toContain("home")
  })

  it("嵌套路由返回对应页面", async () => {
    const response = await handler()(new Request("app://bundle/report/"))
    expect(response.status).toBe(200)
    expect(await response.text()).toContain("report")
  })

  it("静态资源带正确 MIME 与 immutable 缓存", async () => {
    const response = await handler()(new Request("app://bundle/_next/static/chunk.js"))
    expect(response.status).toBe(200)
    expect(response.headers.get("content-type")).toContain("text/javascript")
    expect(response.headers.get("cache-control")).toContain("immutable")
  })

  it("非 HTML 普通资源使用短缓存", async () => {
    const response = await handler()(new Request("app://bundle/font.woff2"))
    expect(response.status).toBe(200)
    expect(response.headers.get("content-type")).toBe("font/woff2")
    expect(response.headers.get("cache-control")).toBe("public, max-age=3600")
  })

  it("未知路径返回 404 页面与 404 状态", async () => {
    const response = await handler()(new Request("app://bundle/missing/"))
    expect(response.status).toBe(404)
    expect(response.headers.get("content-type")).toContain("text/html")
    expect(await response.text()).toContain("missing")
  })

  it("没有 404.html 时回退纯文本", async () => {
    const bareRoot = await mkdtemp(path.join(tmpdir(), "desktop-bare-"))
    await writeFile(path.join(bareRoot, "index.html"), "<h1>home</h1>")
    const response = await createProtocolHandler({ rendererRoot: bareRoot })(
      new Request("app://bundle/missing/"),
    )
    await rm(bareRoot, { recursive: true, force: true })
    expect(response.status).toBe(404)
    expect(await response.text()).toBe("Not Found")
  })

  it("无法构造 URL 或读取文件时返回 404", async () => {
    const invalid = await handler()({ url: "::bad", method: "GET" } as Request)
    expect(invalid.status).toBe(404)

    const failing = await createProtocolHandler({
      rendererRoot: root,
      readFile: async () => {
        throw new Error("boom")
      },
    })(new Request("app://bundle/"))
    expect(failing.status).toBe(404)
  })

  it("拒绝非 bundle host 与非 app 协议", async () => {
    expect((await handler()(new Request("app://other/"))).status).toBe(404)
    expect((await handler()(new Request("http://localhost:3000/"))).status).toBe(404)
  })

  it("路径穿越返回 404 而不是读取外部文件", async () => {
    const response = await handler()(new Request("app://bundle/../secret"))
    expect(response.status).toBe(404)
    expect(await response.text()).toContain("missing")
  })
})
