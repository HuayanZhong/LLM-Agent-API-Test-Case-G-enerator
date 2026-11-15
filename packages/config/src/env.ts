// 本包由 Node 直接加载源码，包内不能写相对 import：.js 说明符不会映射到 .ts。
// 每个配置域保持自包含文件；新增域另起文件，并在 package.json exports 暴露。
import { z } from "zod"

export { z }

/**
 * 环境变量校验失败时抛出，携带字段路径与原因。
 * 启动阶段直接失败，优于运行中静默降级。
 */
export class EnvError extends Error {
  readonly issues: Array<{ path: string; message: string }>

  constructor(message: string, issues: Array<{ path: string; message: string }>) {
    super(message)
    this.name = "EnvError"
    this.issues = issues
  }
}

/** 只解析与校验，不负责加载；env 由调用方传入（通常为 process.env）。 */
export function parseEnv<TSchema extends z.ZodType>(
  schema: TSchema,
  env: Record<string, unknown>,
  options?: { label?: string },
): z.infer<TSchema> {
  const parsed = schema.safeParse(env)
  if (parsed.success) return parsed.data
  const issues = parsed.error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }))
  const label = options?.label ? ` (${options.label})` : ""
  throw new EnvError(`Invalid environment${label}`, issues)
}

/** 必填非空字符串。 */
export function envString() {
  return z.string().min(1)
}

/** 可选字符串；缺失时为 undefined。 */
export function envOptionalString() {
  return z.string().optional()
}

/** 绝对 URL；Zod 4 的顶级 z.url()。 */
export function envUrlString() {
  return z.url()
}

/** 正整数字符串，自动 coercion 为 number；小数、负数与非数字失败。 */
export function envIntString() {
  return z.coerce.number().int().positive()
}

/** 非负整数；端口 0 等边界允许。 */
export function envNonNegativeIntString() {
  return z.coerce.number().int().nonnegative()
}

/**
 * 只接受 true/false/1/0 四种字面量。
 * 不用 z.coerce.boolean()：Boolean("false") 为 true，会让开关类变量静默翻转。
 */
export function envBoolString() {
  return z.enum(["true", "false", "1", "0"]).transform((value) => value === "true" || value === "1")
}
