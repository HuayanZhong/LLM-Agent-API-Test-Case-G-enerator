/** 支持的语言集合；顺序决定语言切换入口的展示顺序。 */
export const LOCALES = ["zh-CN", "en-US"] as const

export type Locale = (typeof LOCALES)[number]

/** 中文是产品默认语言；静态导出的首帧也按它渲染。 */
export const DEFAULT_LOCALE: Locale = "zh-CN"

/** 默认时区：静态导出在构建机与用户机器上可能不同，固定它避免日期格式漂移。 */
export const DEFAULT_TIME_ZONE = "Asia/Shanghai"

/** 与“记住邮箱”共用命名空间，避免和其他本地数据冲突。 */
export const LOCALE_STORAGE_KEY = "interface-test-agent:locale"

/** 本地存储与用户输入都不可信，只接受预定义语言标签。 */
export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value)
}

/** 未知或非法值一律回落默认语言，调用方不需要重复兜底。 */
export function resolveLocale(value: string | null | undefined): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE
}
