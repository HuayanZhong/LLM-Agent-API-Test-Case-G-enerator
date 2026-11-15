# Proposal

## Why

业务逻辑即将接入，`BACKEND_PORT` 与 `BFF_PORT` 目前是 `process.env.X ?? 默认值` 的内联写法：非法值要等 Nest 监听阶段才报错，空字符串会原样进入端口参数。真正敏感的配置（Supabase、模型密钥、开关类变量）接入后，这种静默降级会变成启动后才暴露的问题。先把共享的「解析 + 校验」能力做成骨架，后续每加一个变量只需补 schema。

## What Changes

- 新增 `packages/config`（`@workspace/config`）：私有、`type: module`、源码包，`exports` 指向 `./src/index.ts`，无 build；运行时依赖 `zod`，并 re-export `z` 供各 app 组合 schema。
- 包内只放通用 env 能力：`EnvError`、`parseEnv` 与字符串 / 可选字符串 / URL / 正整数 / 非负整数 / 布尔字面量六个工厂；按配置域拆分，当前只有自包含的 `src/env.ts`，包内不写相对 import。
- `apps/backend` 与 `apps/bff` 各自新增 `src/config.ts`，用共享工厂定义自己的 schema（只含本服务的端口），启动时解析 `process.env`；`main.ts` 改用解析后的配置。
- 行为变化：非法端口或空字符串在启动时抛 `EnvError` 并终止，不再静默落到默认值；合法值与缺省值（5000 / 4000）保持不变。
- `pnpm-workspace.yaml` 的 `backend` catalog 增加 `zod`，版本与锁文件中已解析的 `4.6.7` 对齐。
- 同步新包三件套、根索引与 `openspec/config.yaml` 的 `context`；包数量口径由八个包改为九个。
- 不改变：`desktop` 的 `ELECTRON_RENDERER_URL` 容错回退、`frontend` 的 `NEXT_PUBLIC_BFF_URL`、env 加载链路（仍由根脚本的 `--env-file-if-exists` 与 Turbo strict 模式负责）。

## Capabilities

### New Capabilities

- `shared-config`: 跨应用共享的环境变量解析与校验能力——解析入口、工厂语义、失败方式，以及应用启动时的校验约束。

### Modified Capabilities

无。

## Impact

- 新增：`packages/config/`（`src/index.ts`、`src/env/`、`__tests__/env.test.ts`、`package.json`、`tsconfig.json`、`vitest.config.ts`、`README.md` / `CLAUDE.md` / `AGENTS.md`）。
- 修改：`apps/backend/src/config.ts`（新增）、`apps/backend/src/main.ts`、`apps/backend/src/config.spec.ts`（新增）；`apps/bff` 同样处理；两者 `package.json` 增加 `@workspace/config` 运行时依赖。
- 依赖：`zod` 进入 `backend` catalog；`pnpm-lock.yaml` 更新。
- 测试：新增第 6 个带 Vitest 的包；backend / bff 的 `config.ts` 需要覆盖，行覆盖率门槛仍为 95%。
- 文档：根 `README.md` / `CLAUDE.md` / `AGENTS.md`、`openspec/config.yaml` 的 `context`，以及三个应用包的 CLAUDE 文档。
- 风险：`@workspace/config` 是第一个被 Nest `dist` 在运行时加载的源码包；Node 26 的类型剥离机制已用 `@workspace/vitest-config` 验证可行，落地后仍需实际启动一次 `start:prod`。
