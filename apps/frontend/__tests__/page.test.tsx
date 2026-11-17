import { render } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import Page from "@/app/page"

// 根页面只做客户端跳转；mock router 后断言目标路径，不真正导航。
const replace = vi.hoisted(() => vi.fn<(href: string) => void>())

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}))

beforeEach(() => {
  replace.mockClear()
})

describe("Page", () => {
  it("把根路径跳转到登录页", () => {
    render(<Page />)

    expect(replace).toHaveBeenCalledWith("/login/")
  })
})
