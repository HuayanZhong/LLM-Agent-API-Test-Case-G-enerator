import { envIntString, parseEnv, z } from "@workspace/config"

const backendEnvSchema = z.object({
  BACKEND_PORT: envIntString().default(5000),
})

export type BackendEnv = z.infer<typeof backendEnvSchema>

/**
 * 启动前解析环境变量；非法值抛 EnvError 并中止进程。
 * env 可注入，测试直接传对象覆盖成功与失败路径。
 */
export function loadConfig(env: Record<string, unknown> = process.env): BackendEnv {
  return parseEnv(backendEnvSchema, env, { label: "backend" })
}
