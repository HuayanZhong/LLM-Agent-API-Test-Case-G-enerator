import { describe, expect, it } from "vitest"
import { EnvError } from "@workspace/config"
import { loadConfig } from "./config.js"

describe("loadConfig", () => {
  it("缺失端口时使用 4000", () => {
    expect(loadConfig({})).toEqual({ BFF_PORT: 4000 })
  })

  it("合法端口 coercion 为 number", () => {
    expect(loadConfig({ BFF_PORT: "4100" })).toEqual({ BFF_PORT: 4100 })
  })

  it("非法端口抛 EnvError 并带应用标签", () => {
    expect(() => loadConfig({ BFF_PORT: "abc" })).toThrow(EnvError)
    expect(() => loadConfig({ BFF_PORT: "abc" })).toThrow("Invalid environment (bff)")
  })
})
