import zhCN from "./zh-CN.json"
import enUS from "./en-US.json"

/** zh-CN 是键集合的唯一事实来源，其他语言按同一结构补齐。 */
export type Messages = typeof zhCN

export const messages = {
  "zh-CN": zhCN,
  // 编译期结构校验：en-US 缺键或类型不一致时这里直接报错。
  "en-US": enUS satisfies Messages,
} as const
