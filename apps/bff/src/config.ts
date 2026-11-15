import { envIntString, parseEnv, z } from "@workspace/config"

export const bffEnvSchema = z.object({
  BFF_PORT: envIntString().default(4000),
})

export type BffEnv = z.infer<typeof bffEnvSchema>

/**
 * 启动前解析环境变量；非法值抛 EnvError 并中止进程。
 * env 可注入，测试直接传对象覆盖成功与失败路径。
 */
export function loadConfig(env: Record<string, unknown> = process.env): BffEnv {
  return parseEnv(bffEnvSchema, env, { label: "bff" })
}
