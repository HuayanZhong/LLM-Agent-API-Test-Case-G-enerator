import { describe, expect, it } from "vitest"

import { messages } from "../src"

type Json = string | number | boolean | null | Json[] | { [key: string]: Json }

/** 把嵌套文案拍平成点路径，便于比较两份语言的键集合。 */
function flatten(value: Json, prefix = ""): string[] {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return [prefix]
  }

  return Object.entries(value).flatMap(([key, child]) =>
    flatten(child, prefix ? `${prefix}.${key}` : key),
  )
}

/** 提取 ICU 占位符，插值参数缺失时测试也能发现。 */
function placeholders(value: string): string[] {
  return [...value.matchAll(/\{(\w+)\}/g)].map((match) => match[1] ?? "").sort()
}

function leaves(value: Json, prefix = ""): Array<[string, string]> {
  if (typeof value === "string") {
    return [[prefix, value]]
  }
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return []
  }
  return Object.entries(value).flatMap(([key, child]) =>
    leaves(child, prefix ? `${prefix}.${key}` : key),
  )
}

describe("文案目录", () => {
  it("中英键集合完全一致", () => {
    const zhKeys = flatten(messages["zh-CN"]).sort()
    const enKeys = flatten(messages["en-US"]).sort()
    expect(enKeys).toEqual(zhKeys)
  })

  it("同一键的 ICU 占位符一致", () => {
    const en = new Map(leaves(messages["en-US"]))
    for (const [key, value] of leaves(messages["zh-CN"])) {
      expect(placeholders(value)).toEqual(placeholders(en.get(key) ?? ""))
    }
  })

  it("默认语言包含完整的认证与品牌文案", () => {
    const zhKeys = flatten(messages["zh-CN"])
    for (const key of [
      "common.productName",
      "auth.login.title",
      "auth.register.title",
      "auth.errors.passwordMin",
      "brand.steps.generate.title",
      "meta.loginTitle",
    ]) {
      expect(zhKeys).toContain(key)
    }
  })
})
