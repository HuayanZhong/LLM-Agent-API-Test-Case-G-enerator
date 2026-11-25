import { describe, expect, it } from "vitest"

import { findOffenders } from "./source-scan"

describe("文案不硬编码", () => {
  it("src 下除注释外没有中文字面量", () => {
    // 中文文案只能来自 @workspace/i18n 的词表；这里报出的文件需要把文案改成 t() 键。
    expect(findOffenders(/\p{Script=Han}/u)).toEqual([])
  })
})
