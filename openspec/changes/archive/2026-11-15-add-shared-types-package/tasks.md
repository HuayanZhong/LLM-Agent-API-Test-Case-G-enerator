# Tasks

## 1. 建立 packages/types

- [x] 1.1 创建 `packages/types/package.json`（`private`、`type: module`、`engines`、`exports: { ".": "./src/index.ts" }`、`check-types` / `lint` / `lint:fix` / `format` / `format:fix` 脚本、devDependencies 仅 `typescript` 与 `@workspace/typescript-config`）与 `tsconfig.json`（继承 `base.json`、`noEmit: true`、`include: ["src"]`）；执行 `pnpm install`，验证 `pnpm --filter @workspace/types exec tsc --version` 能解析到本包
- [x] 1.2 创建 `src/index.ts`，导出 `DesktopPlatform` 字符串联合、`DesktopBridge` 与 `HealthResponse`，不写任何运行时值与第三方依赖；验证 `pnpm --filter @workspace/types check-types` 退出码 0
- [x] 1.3 验证 `pnpm --filter @workspace/types lint`、`lint:fix`、`format`、`format:fix` 退出码 0，且包内只有一个源文件、没有相对 import
- [x] 1.4 编写 `packages/types/README.md`、`CLAUDE.md`、`AGENTS.md`，按 [.claude/rules/doc-sync.md](../../../.claude/rules/doc-sync.md) 的包级模板写明命令、目录、准入规则（只收跨进程只读形状；controller 入参、主进程内部契约、运行时值不进包）；验证三份文件存在、互相链接可达、命令可执行

## 2. 桌面壳接入共享类型

- [x] 2.1 `apps/desktop/package.json` 增加 `"@workspace/types": "workspace:*"` 到 `devDependencies`；从 `src/types/index.ts` 移除 `DesktopBridge`，`src/preload.ts` 与 `src/types/global.d.ts` 改为从 `@workspace/types` 导入；验证 `pnpm --filter desktop check-types`、`pnpm --filter desktop test` 退出码 0，且 `preload.test.ts` 仍断言只暴露 `platform` 与 `versions`
- [x] 2.2 更新 `apps/desktop/CLAUDE.md` 与 `README.md` 的类型章节：主进程内部契约留在 `src/types/`，`DesktopBridge` 改为来自 `@workspace/types`，并写明消费方只用 `import type`；验证文档中的路径存在、引用的类型名与源码一致

## 3. Nest 控制器接入响应形状

- [x] 3.1 `apps/bff/package.json` 增加 `"@workspace/types": "workspace:*"` 到 `devDependencies`，`app.controller.ts` 的 `health()` 标注 `: HealthResponse`，DTO 类与校验规则不进共享包；验证 `pnpm --filter bff check-types`、`test`、`build` 退出码 0，且 `grep -r "@workspace/types" apps/bff/dist --include='*.js'` 无输出（`.d.ts` 保留类型引用是预期）
- [x] 3.2 `apps/backend` 按 3.1 同样处理并验证 `check-types`、`test`、`build` 退出码 0，`grep -r "@workspace/types" apps/backend/dist --include='*.js'` 无输出
- [x] 3.3 更新 `apps/bff/CLAUDE.md` 与 `apps/backend/CLAUDE.md` 的约束章节：响应形状从 `@workspace/types` 引用，controller 入参 DTO 留在本包；验证文档引用的路径与类型名存在

## 4. 根索引与 OpenSpec 上下文

- [x] 4.1 更新 `README.md`：顶层结构与 packages 说明加入 `packages/types`，包清单表格补一行；验证新链接指向真实文件、命令能在仓库根执行
- [x] 4.2 更新 `CLAUDE.md` 与 `AGENTS.md`：包清单、包级文档列表、`packages/` 结构说明加入共享类型包，并把「七个包」口径改为「八个包」；验证文中路径存在、包数量与实际 workspace 数一致
- [x] 4.3 更新 `openspec/config.yaml` 的 `context`，写入 `packages/types` 的职责与边界；验证 `openspec validate --all` 退出码 0

## 5. 集成验证

- [x] 5.1 在仓库根执行 `pnpm check-types`、`pnpm lint`、`pnpm format`、`pnpm test`，确认全部退出码 0、行覆盖率仍 ≥ 95%
- [x] 5.2 执行 `pnpm build`，确认四个 app 构建成功，并用 `grep -r "@workspace/types" apps/bff/dist apps/backend/dist --include='*.js'`、`grep -r "@workspace/types" apps/frontend/out`、`grep -r "@workspace/types" apps/desktop/.vite` 确认没有运行时引用（`.d.ts` 的类型引用是预期）
- [x] 5.3 确认 `turbo.json`、`pnpm-workspace.yaml` 与 CI 工作流无需改动：本包没有 `build` / `test` 脚本，`packages/*` 已覆盖新目录；验证 `pnpm-workspace.yaml` 的 packages glob 与目录结构一致

## 6. 按层组织类型

- [x] 6.1 将 `HealthResponse` 拆到 `src/api/health.ts`、`DesktopBridge` 与 `DesktopPlatform` 拆到 `src/bridge/desktop.ts`，各层 `index.ts` 只做 `export type *` 收口；验证 `pnpm --filter @workspace/types check-types`、`lint`、`format` 退出码 0，且 `src/index.ts` 不含具体定义
- [x] 6.2 顶层 `src/index.ts` 只汇总 `api/` 与 `bridge/` 两层，层与层之间没有互相 import；验证 `pnpm check-types` 全部 7 个包通过，NodeNext 与 Bundler 两种解析都能穿过 barrel
- [x] 6.3 同步 `packages/types/README.md`、`CLAUDE.md`、`AGENTS.md` 与本次 `design.md` 的第 5 条决策，写明分层规则；验证目录树与真实文件一致、文档链接可达

## Workflow follow-up

- 实现与验证完成后运行 `openspec-archive-change` 归档本变更，归档前先确认 specs 同步结果。
- 归档后复核 `openspec/specs/shared-types/spec.md` 已生成且 Purpose 非占位文本。
