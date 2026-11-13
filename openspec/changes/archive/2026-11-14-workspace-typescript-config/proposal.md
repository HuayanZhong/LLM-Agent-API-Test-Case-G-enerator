# Proposal

## Why

四个 workspace 包各写一份 tsconfig：`apps/backend` 与 `apps/bff` 逐字重复，`apps/frontend` 与 `packages/ui` 的公共部分也靠手工保持同步。同时 TypeScript 6.0 引入了新的默认值（未声明 `target` 时落成 `LatestStandard`，`moduleDetection` 默认 `force`），升级 TS 时编译行为会悄悄漂移。项目马上要接入测试与 oxc，先把 TypeScript 配置收口，避免之后三套工具链各自改 tsconfig。

## What Changes

- 新增 `packages/typescript-config`（包名 `@workspace/typescript-config`），提供四个共享 profile：`base.json`、`nextjs.json`、`react-library.json`、`nestjs.json`。
- 四个消费包改为 `extends` 共享 profile，并在 `devDependencies` 声明 `"@workspace/typescript-config": "workspace:*"`（pnpm 不声明就不会链接）。
- 按 `extends` 的路径语义划边界：只提取无路径语义的 `compilerOptions`；`include` / `exclude` / `paths` / `outDir` / `rootDir` / `types` / `plugins` 留在各包。
- 各包新增 `check-types` 脚本（`tsc --noEmit`），根 `package.json` 暴露 `check-types`，`turbo.json` 注册同名任务，让类型检查可并行、可缓存。
- 类型检查严格度统一：`noUncheckedIndexedAccess` 进入 `base.json`，`apps/backend` / `apps/bff` 首次纳入该检查。
- 按文档同步规则补 `packages/typescript-config` 的 `README.md` / `CLAUDE.md` / `AGENTS.md`，并同步根 `README.md` / `CLAUDE.md` / `AGENTS.md` 与 `openspec/config.yaml` 的 `context`。
- 明确不做：不引入 Vitest、oxlint、Prettier；不改业务代码、不改端口与启动方式；不新增第三方依赖。

## Capabilities

### New Capabilities

无。本次只改构建与类型检查配置，不改变任何可观察的系统行为，`skip_specs: true`。

### Modified Capabilities

无。

## Impact

- 新增：`packages/typescript-config/`（4 个 profile + 包级文档）。
- 修改：`apps/frontend`、`apps/bff`、`apps/backend`、`packages/ui` 的 `tsconfig.json` 与 `package.json`。
- 修改：根 `package.json`（`check-types` 脚本）、`turbo.json`（`check-types` 任务）。
- 修改：根 `README.md`、`CLAUDE.md`、`AGENTS.md`、`openspec/config.yaml`。
- 依赖：不新增 npm 依赖，不新增 catalog 分类；只新增一个私有 workspace 包。
- 风险：`apps/frontend` 的 tsconfig 加上 `extends` 后，Next 16 会跳过自动写入（见 design），需要把 Next 自己管理的 include 与 `plugins` 保留在 app 内。
