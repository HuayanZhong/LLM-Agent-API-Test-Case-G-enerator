# Design

## Context

见 `proposal.md`。当前 backend / bff 的端口直接内联在 `main.ts`，没有共享的校验规则；仓库里没有直接依赖 `zod`，但锁文件已解析出 `zod@4.6.7` 且 `node_modules/zod` 可解析。现有 packages 全是源码包、无 `dist`；`@workspace/vitest-config` 已经证明 Node 26 能沿 workspace 软链 realpath 加载 `.ts` 源码并剥离类型（`node --input-type=module -e "await import('@workspace/vitest-config')"` 返回了运行时值）。`@workspace/types` 的规则是零运行时值，因此本能力必须独立成 `@workspace/config`。

## Goals / Non-Goals

**Goals:**

- 提供一套可复用、带测试的 env 解析与工厂函数，失败时给出字段路径。
- 让 backend / bff 在启动阶段完成校验，非法配置直接中止。
- 保持源码包形态，不新增构建链路。

**Non-Goals:**

- 不改 env 加载方式：`.env` 仍由根脚本的 `--env-file-if-exists` 与 Turbo strict 模式处理。
- 不接 desktop 的 `ELECTRON_RENDERER_URL`（保留现有容错回退）与 frontend 的 `NEXT_PUBLIC_BFF_URL`。
- 不在共享包中放任何 app 专属 schema、DTO 或业务配置。
- 不引入 `zod` 之外的运行时依赖。

## Decisions

### 1. 源码包，不做构建

`package.json` 设 `private: true`、`type: module`、`exports: { ".": "./src/index.ts" }`，依赖 `zod`，与 `@workspace/vitest-config` 同型。已实测 Node 26 能直接加载 workspace 内 `.ts` 源码；Nest `dist` 的 import 走同一解析链路。备选「tsc 产 dist」会引入 `build` 任务与 `^build` 依赖，对骨架阶段没有必要。

风险控制：`EnvError` 是包内唯一的类，实现后先用 Node 直接加载一次，确认 `readonly issues` 字段在类型剥离后正常；再跑一次 `start:prod`。

### 2. zod 进 `backend` catalog，并由包 re-export `z`

`zod: ^4.6.7` 加入 `pnpm-workspace.yaml` 的 `backend` catalog（后续 Case IR 也要用）。`@workspace/config` 在 `dependencies` 中引用 `catalog:backend`，并 `export { z } from "zod"`：各 app 用同一个统一版本组合自己的 schema，不必各自声明 zod，避免版本漂移。

### 3. 每个配置域一个自包含文件，包内不写相对 import

```text
src/
├── env.ts          # EnvError + parseEnv + 六个工厂 + re-export z（当前唯一域）
└── app.ts          # 未来应用级配置域；新增时在 exports 单独暴露
```

`package.json` 的 `exports` 指向 `./src/env.ts`。不设汇总用的 `src/index.ts`，因为运行时汇总必须写相对 import，而源码包会因此坏掉：

```text
src/index.ts:  export * from "./env/index.js"
Node 运行时:   找 ./env/index.js -> ERR_MODULE_NOT_FOUND（实测）
写 "./env/index.ts": Node 能跑，但 Nest 的 tsc 需要 allowImportingTsExtensions，
                     而 Nest 是 emit 项目，不能开
```

所以规则是：**一个配置域一个自包含文件，域与域之间不互相 import；新增域时另起文件并在 `exports` 里加子路径**。当前只有 `env.ts`；未来出现第二个域（如 `app.ts`）时，root 继续指向 env，新域用 `@workspace/config/app`。这也是 `packages/vitest-config/CLAUDE.md` 记录的「包内不写相对 import」约束在运行时包上的直接后果。

包内不使用相对 import，因此 Node 26 的类型剥离加载不受影响；`@workspace/vitest-config` 已实测同类源码包可以被 Node 直接 import。

### 4. `parseEnv` 与 `EnvError` 的形状

`parseEnv(schema, env, opts?)` 用 `safeParse`，成功返回 `z.infer`；失败把 `issues` 映射为 `{ path, message }` 后抛 `EnvError`。`EnvError` 继承 `Error`，`issues` 只读，`opts.label` 拼进 message。调用方传 `process.env`（`ProcessEnv` 可赋给 `Record<string, unknown>`）。

### 5. 工厂语义

- `envString`：`z.string().min(1)`，拒绝空字符串与缺失值。
- `envOptionalString`：`z.string().optional()`。
- `envUrlString`：`z.url()`（Zod 4 顶级函数），拒绝相对路径与非 URL。
- `envIntString`：`z.coerce.number().int().positive()`，拒绝小数、负数、非数字。
- `envNonNegativeIntString`：`z.coerce.number().int().nonnegative()`，允许 0。
- `envBoolString`：`z.enum(["true","false","1","0"]).transform(...)`，不用 `z.coerce.boolean()`，避免 `"false"` 被静默转成 `true`。

六个工厂全部实现，未用到的工厂视为通用 API，由测试覆盖。

### 6. app 侧 schema 留在各包

backend / bff 各新增 `src/config.ts`：

```ts
export const backendEnvSchema = z.object({
  BACKEND_PORT: envIntString().default(5000),
})

export function loadConfig(env: Record<string, unknown> = process.env) {
  return parseEnv(backendEnvSchema, env, { label: "backend" })
}
```

`main.ts` 改为 `const config = loadConfig()` 后 `app.listen(config.BACKEND_PORT)`。用函数而不是模块级常量，测试可以直接传对象覆盖成功与失败路径，且不需要改 `process.env` 或动态 import。bff 同型，默认 4000。

`DEFAULT` 走 schema 的 `.default()`：变量缺失时用默认值，设置了非法值时仍然失败。

### 7. 测试与覆盖率

`packages/config/__tests__/env.test.ts` 覆盖 `parseEnv` 成功 / 失败 / label 与六个工厂的合法、非法边界；backend / bff 的 `src/config.spec.ts` 覆盖默认值与非法值。`packages/config/vitest.config.ts` 继承 `@workspace/vitest-config/base`，`include: ["__tests__/**/*.test.ts"]`。backend / bff 现有 `coverage.exclude` 只排除 `src/main.ts`，`config.ts` 必须被 spec 覆盖，不能靠排除掩盖。

### 8. 文档与索引

新包写三件套（README / CLAUDE / AGENTS），根 `README.md`、`CLAUDE.md`、`AGENTS.md` 与 `openspec/config.yaml` 的 `context` 同步；包数量口径：lint / format 九个、check-types 八个、test 六个。`turbo.json` 不需要改，任务按脚本自动发现新包。

## Risks / Trade-offs

- [Node 无法加载带 `class` 的 `.ts` 源码] → 实现后单独用 Node import 一次 `@workspace/config`，确认 `EnvError` 可实例化；失败再评估构建方案。
- [`nest build` 的 `dist` 运行时引用源码包] → 落地后 `pnpm --filter bff start:prod` 与 `backend` 各启动一次并检查端口。
- [启动行为变化] → 合法值不变、非法值从静默降级变成失败；在 `.env.example` 与包文档中写明空字符串会被判为非法。
- [`@workspace/config` 变成配置垃圾桶] → 包级 CLAUDE 写明只放通用能力，app schema 不得进入。
- [新增第 6 个测试包与第 9 个包增加 CI 时间] → 包很小，覆盖率门槛不变；P90 由 CI 观察，不提前优化。
- [zod 直接依赖带来供应链面] → 版本走 catalog、已存在于锁文件；`minimumReleaseAge` 仍生效。

## Migration Plan

单次提交，无数据迁移。顺序：catalog 加 zod → 建包与 `pnpm install` → 写 env 层与测试 → backend / bff 接入 → 文档同步。验证：`pnpm check-types`、`lint`、`format`、`test`、`build` 全部 exit 0；`pnpm --filter bff start:prod` 与 `pnpm --filter backend start:prod` 正常监听默认端口；设置 `BACKEND_PORT=abc` 后启动应非零退出并打印字段。回滚直接 revert 本次提交。

## Open Questions

- 公开变量（`NEXT_PUBLIC_BFF_URL`）接入时，schema 是留在 frontend 还是回到共享包？取决于 frontend 是否也需要服务端校验；不影响本次任务拆分。
