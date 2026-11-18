import { afterEach, describe, expect, it, vi } from "vitest"
import { HTTPError, NetworkError, createRequestClient } from "../src/request-client.ts"

type FetchInput = Request | URL | string

// 记录请求 URL 的 fetch stub;ky 走 globalThis.fetch,替换即可拦截
function stubFetch(handler: (url: string, init?: RequestInit) => Response | Promise<Response>) {
  const urls: string[] = []
  const fetchMock = vi.fn<(input: FetchInput, init?: RequestInit) => Promise<Response>>(
    async (input, init) => {
      const url = input instanceof Request ? input.url : String(input)
      urls.push(url)
      return handler(url, init)
    },
  )
  vi.stubGlobal("fetch", fetchMock)
  return { urls, fetchMock }
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("createRequestClient", () => {
  it("合法 baseURL 返回实例,请求以 baseURL 为前缀", async () => {
    const { urls } = stubFetch(() => jsonResponse({ ok: true }))

    const client = createRequestClient({ baseURL: "http://localhost:4000/api/v1" })
    await client.get("health")

    expect(urls[0]).toBe("http://localhost:4000/api/v1/health")
  })

  it("input 以 / 开头时同样拼接到 baseURL 路径之后", async () => {
    const { urls } = stubFetch(() => jsonResponse({ ok: true }))

    const client = createRequestClient({ baseURL: "http://localhost:4000/api/v1" })
    await client.get("/health")

    expect(urls[0]).toBe("http://localhost:4000/api/v1/health")
  })

  const invalidCases: Array<[string | undefined, string]> = [
    [undefined, "缺失"],
    ["", "空串"],
    ["not-a-url", "非法 URL"],
    ["ftp://example.com", "非 http/https"],
  ]

  it.each(invalidCases)("baseURL %s(%s)创建即抛错", (baseURL) => {
    // it.each 的元组类型收窄不掉 undefined,用例本身就是传非法值
    const invalidBaseURL = baseURL as string
    expect(() => createRequestClient({ baseURL: invalidBaseURL })).toThrow(TypeError)
    expect(() => createRequestClient({ baseURL: invalidBaseURL })).toThrow(/baseURL 校验失败/)
  })

  it("环境里没有 NEXT_PUBLIC_* 变量时行为不变", async () => {
    const original = process.env.NEXT_PUBLIC_BFF_URL
    delete process.env.NEXT_PUBLIC_BFF_URL
    try {
      const { urls } = stubFetch(() => jsonResponse({ ok: true }))

      // baseURL 显式传入,不依赖任何环境变量
      const client = createRequestClient({ baseURL: "http://localhost:4000" })
      await client.get("health")

      expect(urls[0]).toBe("http://localhost:4000/health")
    } finally {
      if (original !== undefined) process.env.NEXT_PUBLIC_BFF_URL = original
    }
  })

  it("服务端返回 4xx + JSON 错误体时抛 HTTPError,data 已解析", async () => {
    stubFetch(() => jsonResponse({ code: "AUTH_INVALID", message: "凭证无效" }, 401))

    const client = createRequestClient({ baseURL: "http://localhost:4000" })

    // error.data 由 ky 预解析,消费方不需要自行 response.json()
    const error = await client.get("login").catch((e: unknown) => e)
    expect(error).toBeInstanceOf(HTTPError)
    const httpError = error as HTTPError<{ code: string; message: string }>
    expect(httpError.response.status).toBe(401)
    expect(httpError.data).toEqual({ code: "AUTH_INVALID", message: "凭证无效" })
  })

  it("连接拒绝抛 NetworkError,与 HTTPError 可区分", async () => {
    // 不 stub fetch,用真实网络栈连一个必然拒绝的端口;limit 0 避免 ky 自动重试拖慢测试
    const client = createRequestClient({ baseURL: "http://127.0.0.1:1" })

    const error = await client.get("health", { retry: { limit: 0 } }).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(NetworkError)
    expect(error).not.toBeInstanceOf(HTTPError)
  })

  it("错误类型可由 instanceof 分流:HTTPError 不是 NetworkError", () => {
    // 类型层面的保证:k y的 NetworkError 与 HTTPError 继承自不同分支的错误基类
    expect(HTTPError.name).toBe("HTTPError")
    expect(NetworkError.name).toBe("NetworkError")
  })
})
