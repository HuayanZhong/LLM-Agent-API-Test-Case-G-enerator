# Proposal

## Why

`apps/frontend` 与 `packages/` 目前为空，桌面端还没有可运行的骨架，shadcn 组件也没有统一的落点。先把 Next.js 前端与共享 UI 包按官方 monorepo 方式搭起来，后续业务页面和组件才有稳定的安装与引用路径。

## What Changes

- 新建 `apps/frontend`：Next.js 16 + React 19 + TypeScript，应用代码放在 `src/`，监听 3000。
- 新建 `packages/ui`：包名 `@workspace/ui`，承载 shadcn 组件、`cn()`、Tailwind v4 全局样式与主题变量。
- 两个 workspace 各放一份 `components.json`：在 `apps/frontend` 执行 `shadcn add` 时，UI 组件与依赖自动写入 `packages/ui`，app 级 block 写入 `apps/frontend/src/components`。
- Tailwind v4 使用 `@tailwindcss/postcss`；样式入口放在 `packages/ui/src/styles/globals.css`，显式扫描 `apps/frontend/src` 与 `packages/ui/src`。
- 依赖版本纳入 `pnpm-workspace.yaml` 的 `frontend` catalog；`typescript` 与 `@types/node` 从 `backend` catalog 移到 `tooling`，两个 Nest 服务同步改为 `catalog:tooling`。
- 同步 `README.md`、`CLAUDE.md`、`AGENTS.md`、`openspec/config.yaml` 的当前状态与目录说明。
- 暂不引入 ESLint、Prettier、Vitest；工程一致性与质量工具后续统一处理。
- 顺手修正 `doc/source/technical-architecture.candidate.json` 中 BFF 的归属并重新生成 HTML。

## Capabilities

### New Capabilities

无。本次是脚手架与工程配置变更，不改变系统行为；`.openspec.yaml` 已声明 `skip_specs: true`。

### Modified Capabilities

无。

## Impact

- 新增：`apps/frontend/`、`packages/ui/`
- 修改：根 `pnpm-workspace.yaml`；`apps/backend/package.json`、`apps/bff/package.json`（各两处 catalog 引用）
- 文档：`README.md`、`CLAUDE.md`、`AGENTS.md`、`openspec/config.yaml`、`doc/technical-architecture.html`
- 端口：3000（前端）、4000（BFF）、5000（backend）
- 依赖：Node.js >= 26.12.1、pnpm >= 12.18.0 不变；新增 Next/React/Tailwind/shadcn 相关依赖
- 不涉及：Electron 打包、业务接口、测试与 lint
