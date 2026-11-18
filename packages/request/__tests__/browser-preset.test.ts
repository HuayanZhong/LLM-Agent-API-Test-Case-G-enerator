import { afterEach, describe, expect, it, vi } from "vitest"
import { TimeoutError, createBrowserRequestClient } from "../src/request-client.ts"

type FetchInput = Request | URL | string

function stubFetch(handler: (url: string, init?: RequestInit) => Response | Promise<Response>) {
  const requests: Array<RequestInit | undefined> = []
  const fetchMock = vi.fn<(input: FetchInput, init?: RequestInit) => Promise<Response>>(
    async (input, init) => {
      // ky 2 把 headers 挂在 Request 对象上,统一归一成 init 形态便于断言
      const normalized: RequestInit =
        input instanceof Request ? { headers: input.headers } : (init ?? {})
      requests.push(normalized)
      const url = input instanceof Request ? input.url : String(input)
      return handler(url, normalized)
    },
  )
  vi.stubGlobal("fetch", fetchMock)
  return { requests, fetchMock }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("createBrowserRequestClient", () => {
  it("JSON body 请求自带 JSON Content-Type", async () => {
    const { requests } = stubFetch(
      () =>
        new Response(JSON.stringify({ ok: true }), {
          headers: { "content-type": "application/json" },
        }),
    )

    const client = createBrowserRequestClient({ baseURL: "http://localhost:4000" })
    await client.post("login", { json: { email: "a@b.c", password: "x" } })

    const headers = new Headers(requests[0]?.headers)
    expect(headers.get("content-type")).toBe("application/json")
  })

  it("调用方 headers 覆盖 preset 默认值", async () => {
    const { requests } = stubFetch(
      () =>
        new Response(JSON.stringify({ ok: true }), {
          headers: { "content-type": "application/json" },
        }),
    )

    const client = createBrowserRequestClient({
      baseURL: "http://localhost:4000",
      headers: { "x-request-id": "test-1" },
    })
    await client.get("health")

    const headers = new Headers(requests[0]?.headers)
    expect(headers.get("x-request-id")).toBe("test-1")
    // 未被覆盖的默认值仍然生效
    expect(headers.get("content-type")).toBe("application/json")
  })

  it("调用方显式超时覆盖 preset 默认,超时抛 TimeoutError", async () => {
    // fetch 永不响应;若默认 10s 生效,本测试会拖满 10s,50ms 即失败证明覆盖成功
    stubFetch(() => new Promise<Response>(() => {}))

    const client = createBrowserRequestClient({
      baseURL: "http://localhost:4000",
      timeout: 50,
    })

    const error = await client.get("health", { retry: { limit: 0 } }).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(TimeoutError)
  })
})
