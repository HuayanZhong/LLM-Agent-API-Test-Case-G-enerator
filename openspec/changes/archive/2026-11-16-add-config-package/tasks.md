# Tasks

## 1. 建立 packages/config

- [x] 1.1 在 `pnpm-workspace.yaml` 的 `backend` catalog 增加 `zod`（`^4.6.7`）；创建 `packages/config/package.json`（`private`、`type: module`、`exports: { ".": "./src/env.ts" }`、`dependencies: { "zod": "catalog:backend" }`、`check-types` / `test` / `test:watch` / `lint` / `format` 脚本）、`tsconfig.json`、`vitest.config.ts`；执行 `pnpm install`，验证 `pnpm --filter @workspace/config exec tsc --version` 能解析到本包
- [x] 1.2 创建自包含的 `src/env.ts`（`EnvError` + `parseEnv` + 六个工厂 + re-export `z`，不写相对 import）；验证 `pnpm --filter @workspace/config check-types` 退出码 0，且用 Node 直接 import 本包能实例化 `EnvError`
- [x] 1.3 创建 `packages/config/__tests__/env.test.ts`，覆盖 `parseEnv` 成功 / 失败 / label 与六个工厂的合法、非法边界；验证 `pnpm --filter @workspace/config test` 退出码 0、行覆盖率 ≥ 95%
- [x] 1.4 编写 `packages/config/README.md`、`CLAUDE.md`、`AGENTS.md`，写明只放通用 env 能力、app schema 留在各自包、`z` 统一入口与运行时代码边界；验证三份文件存在、链接可达、`pnpm --filter @workspace/config lint` / `format` 退出码 0

## 2. backend 接入

- [x] 2.1 `apps/backend/package.json` 在 `dependencies` 增加 `"@workspace/config": "workspace:*"`；新增 `src/config.ts`（`backendEnvSchema` + `loadConfig`）与 `src/config.spec.ts`（默认 5000、合法值、非法值抛错），`src/main.ts` 改用 `loadConfig()`；验证 `pnpm --filter backend check-types`、`test` 退出码 0，行覆盖率 ≥ 95%
- [x] 2.2 更新 `apps/backend/CLAUDE.md`：`src/config.ts` 入口、`@workspace/config` 是运行时依赖、非法端口启动即失败；验证文档路径存在、命令可执行

## 3. bff 接入

- [x] 3.1 `apps/bff/package.json` 在 `dependencies` 增加 `"@workspace/config": "workspace:*"`；新增 `src/config.ts`（`bffEnvSchema` + `loadConfig`）与 `src/config.spec.ts`（默认 4000、合法值、非法值抛错），`src/main.ts` 改用 `loadConfig()`；验证 `pnpm --filter bff check-types`、`test` 退出码 0，行覆盖率 ≥ 95%
- [x] 3.2 更新 `apps/bff/CLAUDE.md`：`src/config.ts` 入口、运行时依赖、非法端口启动即失败；验证文档路径存在、命令可执行

## 4. 根索引与 OpenSpec 上下文

- [x] 4.1 更新 `README.md`：顶层结构与 packages 说明加入 `packages/config`，包清单表格补一行，并写一句「env 解析与校验在 @workspace/config」；验证新链接指向真实文件
- [x] 4.2 更新 `CLAUDE.md` 与 `AGENTS.md`：包清单、包级文档列表、`packages/` 结构说明加入 config 包，包数量口径改为 lint / format 九个、check-types 八个、test 六个；验证文中路径存在
- [x] 4.3 更新 `openspec/config.yaml` 的 `context`，写入 `packages/config` 的职责与「加载仍由根脚本负责」的边界；验证 `openspec validate --all` 退出码 0

## 5. 集成验证

- [x] 5.1 在仓库根执行 `pnpm check-types`、`pnpm lint`、`pnpm format`、`pnpm test`，确认全部退出码 0、行覆盖率仍 ≥ 95%
- [x] 5.2 执行 `pnpm build`，确认四个 app 构建成功；分别运行 `pnpm --filter backend start:prod` 与 `pnpm --filter bff start:prod`，确认默认监听 5000 / 4000 且 env 解析在 `dist` 运行时生效（本机 5000 / 4000 已被既有进程占用，运行态用 5100 / 4100 验证；默认值由 `config.spec.ts` 覆盖）
- [x] 5.3 用 `BACKEND_PORT=abc pnpm --filter backend start:prod` 与 `BFF_PORT= pnpm --filter bff start:prod` 验证进程非零退出并打印字段；确认 `turbo.json` 无需改动，`@workspace/config` 在应用侧是 `dependencies` 而非 `devDependencies`

## Workflow follow-up

- 实现与验证完成后运行 `openspec-archive-change` 归档本变更，归档前先同步 delta 到 `openspec/specs/shared-config/spec.md`。
- 归档后复核主规格 Purpose 与 README 的包清单一致。
