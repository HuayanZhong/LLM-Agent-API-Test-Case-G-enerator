import { describe, expect, it } from "vitest"

import { DEFAULT_LOCALE, LOCALES, isLocale, resolveLocale } from "../src/config"

describe("isLocale", () => {
  it("只接受预定义语言标签", () => {
    expect(isLocale("zh-CN")).toBe(true)
    expect(isLocale("en-US")).toBe(true)
    expect(isLocale("en")).toBe(false)
    expect(isLocale("")).toBe(false)
    expect(isLocale(null)).toBe(false)
    expect(isLocale(42)).toBe(false)
  })
})

describe("resolveLocale", () => {
  it("合法值原样返回", () => {
    expect(resolveLocale("en-US")).toBe("en-US")
  })

  it("空值、未知值与非法值回落默认语言", () => {
    expect(resolveLocale(null)).toBe(DEFAULT_LOCALE)
    expect(resolveLocale(undefined)).toBe(DEFAULT_LOCALE)
    expect(resolveLocale("zh-TW")).toBe(DEFAULT_LOCALE)
    expect(resolveLocale("")).toBe(DEFAULT_LOCALE)
  })
})

describe("语言集合", () => {
  it("默认语言属于支持列表", () => {
    expect(LOCALES).toContain(DEFAULT_LOCALE)
  })
})
