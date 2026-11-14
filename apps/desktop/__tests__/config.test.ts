import { describe, expect, it } from "vitest"
import {
  APP_ORIGIN,
  APP_URL,
  DEFAULT_DEV_RENDERER_URL,
  getAllowedOrigins,
  getNavigationOrigin,
  getRendererUrl,
} from "../src/config"

describe("getRendererUrl", () => {
  it("打包态固定返回 app://bundle/", () => {
    expect(getRendererUrl({ isPackaged: true })).toBe(APP_URL)
  })

  it("开发态默认加载 localhost:3000", () => {
    expect(getRendererUrl({ isPackaged: false })).toBe(DEFAULT_DEV_RENDERER_URL)
  })

  it("开发态尊重自定义地址", () => {
    expect(getRendererUrl({ isPackaged: false, devUrl: "http://localhost:3100/" })).toBe(
      "http://localhost:3100/",
    )
  })

  it("开发态忽略无效地址并回退默认值", () => {
    expect(getRendererUrl({ isPackaged: false, devUrl: "not-a-url" })).toBe(
      DEFAULT_DEV_RENDERER_URL,
    )
  })
})

describe("getAllowedOrigins", () => {
  it("打包态只允许 app://bundle", () => {
    expect(getAllowedOrigins({ isPackaged: true })).toEqual([APP_ORIGIN])
  })

  it("开发态允许开发服务器 origin", () => {
    expect(getAllowedOrigins({ isPackaged: false, devUrl: "http://localhost:3100/" })).toEqual([
      "http://localhost:3100",
    ])
  })
})

describe("getNavigationOrigin", () => {
  it("把 app:// 转成稳定的 origin 字符串", () => {
    expect(getNavigationOrigin("app://bundle/report/")).toBe(APP_ORIGIN)
  })

  it("保留 http origin", () => {
    expect(getNavigationOrigin("http://localhost:3000/foo")).toBe("http://localhost:3000")
  })

  it("拒绝非 web origin", () => {
    expect(getNavigationOrigin("file:///C:/secret.txt")).toBeNull()
    expect(getNavigationOrigin("mailto:test@example.com")).toBeNull()
    expect(getNavigationOrigin("not-a-url")).toBeNull()
  })
})
