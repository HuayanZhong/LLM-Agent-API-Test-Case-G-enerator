# Tasks

## 1. 共享配置包

- [x] 1.1 创建 `packages/typescript-config/package.json`（`@workspace/typescript-config`、`private`、`version: 0.0.0`），跑 `pnpm install` 后确认包已被 workspace 识别。
- [x] 1.2 按 design D2 写 `base.json`、`nextjs.json`、`react-library.json`、`nestjs.json`；验证四个文件均为合法 JSON，且 `base.json` 显式声明了 `target` / `module` / `moduleResolution` / `moduleDetection`。
- [x] 1.3 补包级 `README.md` / `CLAUDE.md` / `AGENTS.md`，按 [.claude/rules/doc-sync.md](../../../.claude/rules/doc-sync.md) 的固定章节；验证相对链接可达、README 的 profile 对照表与四个 json 一致。

## 2. Nest 两个包

- [x] 2.1 `apps/backend` 的 `tsconfig.json` 改为 `extends "@workspace/typescript-config/nestjs.json"`，保留 `outDir` / `rootDir` / `types: ["node"]`；加 workspace 依赖与 `check-types` 脚本。验证：`pnpm install` 后 `pnpm exec tsc --showConfig -p apps/backend/tsconfig.json` 显示装饰器、`strict`、`noUncheckedIndexedAccess` 来自继承；`pnpm --filter backend build` 与 `pnpm --filter backend check-types` 退出码均为 0。
- [x] 2.2 `apps/bff` 做同样改动（此前与 backend 逐字重复）。验证：`tsc --showConfig -p apps/bff/tsconfig.json` 与 2.1 结果一致；`pnpm --filter bff build` 与 `pnpm --filter bff check-types` 退出码均为 0。

## 3. UI 包

- [x] 3.1 `packages/ui` 的 `tsconfig.json` 改为 `extends "@workspace/typescript-config/react-library.json"`，保留 `paths` / `include` / `exclude`；加 workspace 依赖与 `check-types` 脚本。验证：`tsc --showConfig -p packages/ui/tsconfig.json` 显示 `ESNext` / `Bundler` / `react-jsx` / `noEmit`；`pnpm --filter @workspace/ui check-types` 退出码 0。

## 4. 前端

- [x] 4.1 `apps/frontend` 的 `tsconfig.json` 改为 `extends "@workspace/typescript-config/nextjs.json"`，保留 `plugins`、`paths`、`include`、`exclude`（design D4：Next 见到 `extends` 会跳过自动写入）；加 workspace 依赖与 `check-types` 脚本。验证：`tsc --showConfig -p apps/frontend/tsconfig.json` 显示继承值与本地 include 都在；`pnpm --filter frontend check-types` 与 `pnpm --filter frontend build` 退出码均为 0。
- [x] 4.2 跑一次 `pnpm --filter frontend dev` 后检查 `git diff apps/frontend/tsconfig.json` 为空；若 `next-env.d.ts` 因 dev/build 切换而变化，还原后确认不在本次提交内。

## 5. Turbo 与根脚本

- [x] 5.1 根 `package.json` 加 `"check-types": "turbo run check-types"`，`turbo.json` 注册 `check-types` 任务（`description` + `dependsOn: ["^check-types"]`）。验证：`pnpm check-types` 退出码 0，输出包含 backend、bff、frontend、`@workspace/ui` 四个包；第二次运行命中缓存。
- [x] 5.2 Nest 两个包的增量编译缓存改到 `node_modules/.cache`（`tsconfig.json` 与 `tsconfig.build.json` 各写 `tsBuildInfoFile`），并删除 app 根目录残留的 `*.tsbuildinfo`。验证：`pnpm --filter backend build`、`pnpm --filter bff build` 后 app 根目录无 `*.tsbuildinfo`，缓存文件出现在各自 `node_modules/.cache/`。

## 6. 文档同步与集成验证

- [x] 6.1 同步根 `README.md`（包表、目录结构、`pnpm check-types` 命令）、`CLAUDE.md`（仓库结构与包清单）、`AGENTS.md`（包入口）、`openspec/config.yaml` 的 `context`。验证：`doc-sync.md` 的收尾清单逐项通过，README 中的命令实际可跑。
- [x] 6.2 集成验证：干净执行 `pnpm install`、`pnpm check-types`、`pnpm --filter frontend build`、`pnpm --filter backend build`、`pnpm --filter bff build`、`pnpm exec openspec validate --all`，全部退出码 0；确认没有新增未跟踪产物（`*.tsbuildinfo` 已被 `.gitignore` 覆盖）。

## Workflow follow-up

- 按项目评审要求确认后，归档该变更。
