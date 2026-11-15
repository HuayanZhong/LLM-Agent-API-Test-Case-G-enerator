import { describe, expect, it } from "vitest"
import { EnvError } from "@workspace/config"
import { loadConfig } from "./config.js"

describe("loadConfig", () => {
  it("缺失端口时使用 5000", () => {
    expect(loadConfig({})).toEqual({ BACKEND_PORT: 5000 })
  })

  it("合法端口 coercion 为 number", () => {
    expect(loadConfig({ BACKEND_PORT: "6000" })).toEqual({ BACKEND_PORT: 6000 })
  })

  it("非法端口抛 EnvError 并带应用标签", () => {
    expect(() => loadConfig({ BACKEND_PORT: "abc" })).toThrow(EnvError)
    expect(() => loadConfig({ BACKEND_PORT: "abc" })).toThrow("Invalid environment (backend)")
  })
})
