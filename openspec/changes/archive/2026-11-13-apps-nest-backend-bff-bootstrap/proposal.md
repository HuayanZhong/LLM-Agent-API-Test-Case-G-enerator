# Proposal

## Why

根目录配置已经稳定，但 `apps/backend` 与 `apps/bff` 还是空目录。先把两个 Nest 服务搭成可运行的最小骨架，固定端口、依赖版本和启动方式，后续的用例生成、执行、比对与 BFF 适配才有落点。本批不做任何业务逻辑。

## What Changes

- 新增 `apps/backend`：NestJS 12 骨架，监听 `5000`，提供 `GET /health`。
- 新增 `apps/bff`：NestJS 12 骨架，监听 `4000`，提供 `GET /health`。BFF 从原设计的 Next Route Handlers 改为独立 Nest 服务；Next 只保留前端角色。
- 两个 app 使用同一套最小文件集：`package.json`、`nest-cli.json`、`tsconfig.json`、`tsconfig.build.json`、`src/main.ts`、`src/app.module.ts`、`src/app.controller.ts`；不生成 service、测试、Vitest、oxlint、Prettier、README、AGENTS、`.gitattributes`。
- 依赖统一放进 `pnpm-workspace.yaml` 的 `backend` catalog，两个 app 通过 `catalog:backend` 引用；`@nestjs/*` 使用 12.5.x，TypeScript 使用 6.0.x，`@types/node` 使用 26.x。
- 端口约定：`3000` 预留给后续 Next 前端，`4000` 给 BFF，`5000` 给 backend。
- 同步 `README.md`、`CLAUDE.md`、`AGENTS.md` 与 `openspec/config.yaml` 的 `context`；技术架构图中 BFF 的归属留到后续单独更新。

无破坏性变更。

## Capabilities

纯脚手架，不改变系统行为，`.openspec.yaml` 声明 `skip_specs: true`。

### New Capabilities

- 无。

### Modified Capabilities

- 无。

## Impact

- 新增 `apps/backend` 与 `apps/bff` 两个 workspace 包。
- 修改 `pnpm-workspace.yaml` 的 `backend` catalog 与 `pnpm-lock.yaml`。
- 根 `turbo.json` 不需要改：两个 app 都提供 `dev`，根 `pnpm dev` 会并行启动。
- 不引入数据库、模型调用、A2A、MCP 或业务模块。
