import { describe, expect, it } from "vitest"

import { findOffenders } from "./source-scan"

// 根字号通过 --app-font-scale 随视口缩放，只有 rem 类尺寸会一起放大。
// 任意 px 会把该处尺寸钉死，大屏下与周边元素脱节，所以源码里不允许出现。
describe("尺寸不使用硬编码 px", () => {
  it("src 下除注释外没有 px 尺寸", () => {
    expect(findOffenders(/[0-9]+px/)).toEqual([])
  })

  it("Tailwind 任意值里也不写 px（发丝线用 h-px）", () => {
    expect(findOffenders(/\[[^\]]*[0-9]+px[^\]]*\]/)).toEqual([])
  })
})
