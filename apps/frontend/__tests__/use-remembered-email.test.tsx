import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it } from "vitest"
import { useRememberedEmail } from "@/app/(auth)/_hooks/use-remembered-email"
import { REMEMBERED_EMAIL_KEY } from "@/app/(auth)/_lib/auth-constants"

// 每个用例前清空 localStorage，避免上一个用例保存的邮箱串进来。
beforeEach(() => {
  window.localStorage.clear()
})

describe("useRememberedEmail", () => {
  it("从本地恢复邮箱并默认勾选记住邮箱", () => {
    window.localStorage.setItem(REMEMBERED_EMAIL_KEY, "tester@example.com")

    const { result } = renderHook(() => useRememberedEmail())

    expect(result.current.email).toBe("tester@example.com")
    expect(result.current.remember).toBe(true)
  })

  it("编辑邮箱与勾选状态", () => {
    const { result } = renderHook(() => useRememberedEmail())

    act(() => result.current.setEmail("typed@example.com"))
    act(() => result.current.setRemember(true))

    expect(result.current.email).toBe("typed@example.com")
    expect(result.current.remember).toBe(true)
  })

  it("保存时去掉首尾空格，清除只移除邮箱键", () => {
    window.localStorage.setItem("other-key", "keep")
    const { result } = renderHook(() => useRememberedEmail())

    act(() => result.current.save("  saved@example.com  "))
    expect(window.localStorage.getItem(REMEMBERED_EMAIL_KEY)).toBe("saved@example.com")

    act(() => result.current.clear())
    expect(window.localStorage.getItem(REMEMBERED_EMAIL_KEY)).toBeNull()
    expect(window.localStorage.getItem("other-key")).toBe("keep")
  })

  it("监听 storage 事件，同步其他窗口的邮箱修改", () => {
    const { result } = renderHook(() => useRememberedEmail())
    expect(result.current.email).toBe("")

    act(() => {
      window.localStorage.setItem(REMEMBERED_EMAIL_KEY, "other@example.com")
      window.dispatchEvent(new StorageEvent("storage", { key: REMEMBERED_EMAIL_KEY }))
    })

    expect(result.current.email).toBe("other@example.com")
    expect(result.current.remember).toBe(true)

    act(() => {
      window.localStorage.removeItem(REMEMBERED_EMAIL_KEY)
      window.dispatchEvent(new StorageEvent("storage", { key: REMEMBERED_EMAIL_KEY }))
    })

    expect(result.current.email).toBe("")
  })
})
