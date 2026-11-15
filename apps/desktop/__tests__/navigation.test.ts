import { describe, expect, it, vi } from "vitest"
import { configureNavigation, isAllowedNavigation, isExternalHttpUrl } from "../src/app/navigation"

describe("isExternalHttpUrl", () => {
  it("识别 http 与 https", () => {
    expect(isExternalHttpUrl("https://example.com")).toBe(true)
    expect(isExternalHttpUrl("http://example.com")).toBe(true)
  })

  it("不把应用内协议或非 web 协议当外链", () => {
    expect(isExternalHttpUrl("app://bundle/")).toBe(false)
    expect(isExternalHttpUrl("file:///C:/secret.txt")).toBe(false)
    expect(isExternalHttpUrl("mailto:test@example.com")).toBe(false)
    expect(isExternalHttpUrl("not-a-url")).toBe(false)
  })
})

describe("isAllowedNavigation", () => {
  const devOrigins = ["http://localhost:3000"]
  const prodOrigins = ["app://bundle"]

  it("允许开发态同 origin 的路径", () => {
    expect(isAllowedNavigation("http://localhost:3000/report/", devOrigins)).toBe(true)
  })

  it("拒绝不同 origin 与相似域名", () => {
    expect(isAllowedNavigation("http://localhost:3000.evil.com/", devOrigins)).toBe(false)
    expect(isAllowedNavigation("http://127.0.0.1:3000/", devOrigins)).toBe(false)
  })

  it("生产态只允许 app://bundle", () => {
    expect(isAllowedNavigation("app://bundle/report/", prodOrigins)).toBe(true)
    expect(isAllowedNavigation("app://other/report/", prodOrigins)).toBe(false)
  })

  it("拒绝 file 与非法 URL", () => {
    expect(isAllowedNavigation("file:///C:/secret.txt", prodOrigins)).toBe(false)
    expect(isAllowedNavigation("not-a-url", prodOrigins)).toBe(false)
  })
})

describe("configureNavigation", () => {
  function fakeWebContents() {
    let windowOpenHandler: ((details: { url: string }) => { action: "deny" }) | undefined
    let willNavigate: ((event: { preventDefault(): void }, url: string) => void) | undefined
    return {
      setWindowOpenHandler(handler: (details: { url: string }) => { action: "deny" }) {
        windowOpenHandler = handler
      },
      on(event: string, listener: (event: { preventDefault(): void }, url: string) => void) {
        if (event === "will-navigate") willNavigate = listener
      },
      openWindow(url: string) {
        return windowOpenHandler?.({ url })
      },
      navigate(url: string) {
        const event = { preventDefault: vi.fn<() => void>() }
        willNavigate?.(event, url)
        return event
      },
    }
  }

  it("外部链接交给系统浏览器且拒绝新窗口", () => {
    const openExternal = vi.fn<(url: string) => void>()
    const wc = fakeWebContents()
    configureNavigation(wc, ["app://bundle"], openExternal)
    expect(wc.openWindow("https://example.com")).toEqual({ action: "deny" })
    expect(openExternal).toHaveBeenCalledWith("https://example.com")
  })

  it("非白名单导航被拦截，外链仍交给系统浏览器", () => {
    const openExternal = vi.fn<(url: string) => void>()
    const wc = fakeWebContents()
    configureNavigation(wc, ["app://bundle"], openExternal)
    expect(wc.navigate("https://example.com").preventDefault).toHaveBeenCalled()
    expect(openExternal).toHaveBeenCalledWith("https://example.com")
  })

  it("非 http 的新窗口请求只拒绝、不打开浏览器", () => {
    const openExternal = vi.fn<(url: string) => void>()
    const wc = fakeWebContents()
    configureNavigation(wc, ["app://bundle"], openExternal)
    expect(wc.openWindow("file:///C:/secret.txt")).toEqual({ action: "deny" })
    expect(openExternal).not.toHaveBeenCalled()
  })

  it("非白名单且非 http 的导航只拦截", () => {
    const openExternal = vi.fn<(url: string) => void>()
    const wc = fakeWebContents()
    configureNavigation(wc, ["app://bundle"], openExternal)
    expect(wc.navigate("file:///C:/secret.txt").preventDefault).toHaveBeenCalled()
    expect(openExternal).not.toHaveBeenCalled()
  })

  it("白名单导航不拦截", () => {
    const openExternal = vi.fn<(url: string) => void>()
    const wc = fakeWebContents()
    configureNavigation(wc, ["app://bundle"], openExternal)
    expect(wc.navigate("app://bundle/report/").preventDefault).not.toHaveBeenCalled()
    expect(openExternal).not.toHaveBeenCalled()
  })
})
