import { describe, expect, it } from "vitest"
import {
  EnvError,
  envBoolString,
  envIntString,
  envNonNegativeIntString,
  envOptionalString,
  envString,
  envUrlString,
  parseEnv,
  z,
} from "../src/env.ts"

// 在 catch 里写 expect 会触发 no-conditional-expect；先捕获再断言。
function captureError(run: () => unknown): unknown {
  try {
    run()
  } catch (error) {
    return error
  }
  return undefined
}

describe("parseEnv", () => {
  it("校验通过时返回类型安全的配置", () => {
    const schema = z.object({
      PORT: envIntString(),
      HOST: envString(),
    })

    expect(parseEnv(schema, { PORT: "3000", HOST: "localhost" })).toEqual({
      PORT: 3000,
      HOST: "localhost",
    })
  })

  it("校验失败抛 EnvError，issues 携带字段路径与原因", () => {
    const schema = z.object({
      PORT: envIntString(),
      HOST: envString(),
    })

    const error = captureError(() => parseEnv(schema, { PORT: "abc", HOST: "" }))

    expect(error).toBeInstanceOf(EnvError)
    const envError = error as EnvError
    expect(envError.name).toBe("EnvError")
    expect(envError.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: "PORT" }),
        expect.objectContaining({ path: "HOST" }),
      ]),
    )
  })

  it("label 出现在错误 message 中", () => {
    const schema = z.object({ HOST: envString() })

    expect(() => parseEnv(schema, {}, { label: "backend" })).toThrow(
      "Invalid environment (backend)",
    )
    expect(() => parseEnv(schema, {})).toThrow("Invalid environment")
  })
})

describe("envString", () => {
  it("非空字符串通过", () => {
    expect(envString().parse("hello")).toBe("hello")
  })

  it("空字符串与缺失值失败", () => {
    expect(() => envString().parse("")).toThrow(/.+/)
    expect(() => envString().parse(undefined)).toThrow(/.+/)
  })
})

describe("envOptionalString", () => {
  it("缺失时为 undefined，提供时透传", () => {
    expect(envOptionalString().parse(undefined)).toBeUndefined()
    expect(envOptionalString().parse("v")).toBe("v")
  })
})

describe("envUrlString", () => {
  it("合法 URL 通过，非法 URL 失败", () => {
    expect(envUrlString().parse("https://example.com")).toBe("https://example.com")
    expect(() => envUrlString().parse("not-a-url")).toThrow(/.+/)
  })
})

describe("envIntString", () => {
  it("整数字符串 coercion 为 number", () => {
    expect(envIntString().parse("3000")).toBe(3000)
  })

  it("非整数、浮点、负数、非数字均失败", () => {
    expect(() => envIntString().parse("abc")).toThrow(/.+/)
    expect(() => envIntString().parse("1.5")).toThrow(/.+/)
    expect(() => envIntString().parse("-1")).toThrow(/.+/)
    expect(() => envIntString().parse("")).toThrow(/.+/)
  })
})

describe("envNonNegativeIntString", () => {
  it("0 与正整数通过", () => {
    expect(envNonNegativeIntString().parse("0")).toBe(0)
    expect(envNonNegativeIntString().parse("8080")).toBe(8080)
  })

  it("负数与非数字失败", () => {
    expect(() => envNonNegativeIntString().parse("-1")).toThrow(/.+/)
    expect(() => envNonNegativeIntString().parse("x")).toThrow(/.+/)
  })
})

describe("envBoolString", () => {
  it("仅接受 true/false/1/0 四种字面量并映射为 boolean", () => {
    expect(envBoolString().parse("true")).toBe(true)
    expect(envBoolString().parse("1")).toBe(true)
    expect(envBoolString().parse("false")).toBe(false)
    expect(envBoolString().parse("0")).toBe(false)
  })

  it("其余值 fail-fast，不静默 coercion", () => {
    expect(() => envBoolString().parse("yes")).toThrow(/.+/)
    expect(() => envBoolString().parse("")).toThrow(/.+/)
    // 回归防护：Boolean("false") === true，宽松 coercion 会让开关意外开启。
    expect(() => envBoolString().parse("false ")).toThrow(/.+/)
  })
})
