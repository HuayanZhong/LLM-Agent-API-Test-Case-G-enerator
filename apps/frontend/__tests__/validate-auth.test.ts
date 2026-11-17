import { describe, expect, it } from "vitest"
import { validateEmail, validateLogin, validateRegister } from "@/app/(auth)/_lib/validate-auth"

// 校验契约：邮箱格式、密码至少 6 位、验证码 6 位数字；不判断邮箱是否已注册。
describe("validateEmail", () => {
  it("空邮箱与只有空白的邮箱都报必填", () => {
    expect(validateEmail("")).toBe("请输入邮箱")
    expect(validateEmail("   ")).toBe("请输入邮箱")
  })

  it("缺少 @ 或域名后缀时报格式错误", () => {
    expect(validateEmail("tester")).toBe("请输入有效邮箱")
    expect(validateEmail("tester@example")).toBe("请输入有效邮箱")
  })

  it("合法邮箱返回 undefined", () => {
    expect(validateEmail("tester@example.com")).toBeUndefined()
  })
})

describe("validateLogin", () => {
  it("邮箱与密码为空时分别报错", () => {
    expect(validateLogin({ email: "", password: "" })).toEqual({
      email: "请输入邮箱",
      password: "请输入密码",
    })
  })

  it("邮箱格式错误与密码过短可同时出现", () => {
    expect(validateLogin({ email: "tester", password: "12345" })).toEqual({
      email: "请输入有效邮箱",
      password: "密码至少 6 位",
    })
  })

  it("合法登录输入不返回错误", () => {
    expect(validateLogin({ email: "tester@example.com", password: "123456" })).toEqual({})
  })
})

describe("validateRegister", () => {
  it("邮箱、密码与验证码为空时分别报错", () => {
    expect(validateRegister({ email: "", password: "", code: "" })).toEqual({
      email: "请输入邮箱",
      password: "请输入密码",
      code: "请输入验证码",
    })
  })

  it("验证码必须是 6 位数字", () => {
    expect(
      validateRegister({ email: "tester@example.com", password: "123456", code: "12345" }),
    ).toEqual({
      code: "请输入 6 位数字验证码",
    })
    expect(
      validateRegister({ email: "tester@example.com", password: "123456", code: "12345a" }),
    ).toEqual({
      code: "请输入 6 位数字验证码",
    })
  })

  it("合法注册输入不返回错误", () => {
    expect(
      validateRegister({ email: "tester@example.com", password: "123456", code: "123456" }),
    ).toEqual({})
  })
})
