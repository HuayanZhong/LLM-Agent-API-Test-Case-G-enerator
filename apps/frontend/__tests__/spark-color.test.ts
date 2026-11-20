import { afterEach, describe, expect, it, vi } from "vitest"
import { resolveSparkColor } from "@/lib/spark-color"

function stubCanvas(pixel: [number, number, number, number] | null) {
  const ctx = pixel
    ? {
        fillStyle: "",
        fillRect: () => {},
        getImageData: () => ({ data: new Uint8ClampedArray(pixel) }),
      }
    : null
  return vi
    .spyOn(HTMLCanvasElement.prototype, "getContext")
    .mockReturnValue(ctx as unknown as CanvasRenderingContext2D)
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe("resolveSparkColor", () => {
  it("把 oklch 令牌经画布像素折算为 rgb() 字符串", () => {
    vi.stubGlobal(
      "getComputedStyle",
      vi.fn(() => ({ color: "oklch(0.5 0.1 200)" })),
    )
    stubCanvas([10, 20, 30, 255])

    expect(resolveSparkColor()).toBe("rgb(10, 20, 30)")
  })

  it("令牌缺失(computed 为空)时返回 undefined", () => {
    vi.stubGlobal(
      "getComputedStyle",
      vi.fn(() => ({ color: "" })),
    )
    stubCanvas([0, 0, 0, 255])

    expect(resolveSparkColor()).toBeUndefined()
  })

  it("canvas 不可用时返回 undefined,不抛错", () => {
    vi.stubGlobal(
      "getComputedStyle",
      vi.fn(() => ({ color: "oklch(0.5 0.1 200)" })),
    )
    stubCanvas(null)

    expect(resolveSparkColor()).toBeUndefined()
  })
})
