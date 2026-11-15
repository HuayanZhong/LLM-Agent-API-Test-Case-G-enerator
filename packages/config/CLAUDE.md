# CLAUDE.md

本文件是 `packages/config` 的包级规则。项目级规则见 [../../CLAUDE.md](../../CLAUDE.md)。

## 本包职责

`@workspace/config`：跨应用共享的环境变量解析与校验。只有运行时工具函数，没有 dev / build 脚本、没有进程与端口；不负责加载 `.env`。

## 命令与端口

- 无端口、无 `dev` / `build` 脚本。
- `pnpm --filter @workspace/config check-types` 做本包类型检查。
- `pnpm --filter @workspace/config test`（行覆盖率 ≥ 95%）与 `test:watch`。
- `pnpm --filter @workspace/config lint` / `format`，配置用根 `.oxlintrc.json` / `.oxfmtrc.json`。

## 目录与入口

- `src/env.ts`：`EnvError`、`parseEnv`、六个工厂与 `z` 的 re-export；当前唯一的配置域，自包含。
- `package.json` 的 `exports` 指向 `./src/env.ts`；新增配置域时另起文件并加子路径导出，root 继续指向 env。
- 消费方用 `import { parseEnv, z } from "@workspace/config"`，schema 定义在各自应用内。

## 本包约束

- 本包是运行时依赖，消费方必须放在 `dependencies`，不是 `devDependencies`。
- 包内不写相对 import：Node 直接加载 `.ts` 源码时 `.js` 说明符不会映射到 `.ts`；写 `.ts` 会让 Nest 的 tsc 需要 `allowImportingTsExtensions`。一个配置域一个自包含文件。
- 只写 Node 类型剥离支持的语法；不要用 `enum`、`namespace` 或参数属性。
- 不读 `process.env`、不加载 `.env`；`parseEnv` 的 env 参数由调用方传入，保证测试可注入。
- 不放 app 专属 schema、controller DTO、Electron 主进程类型或业务配置。
- 布尔变量只用 `envBoolString`；不要改回 `z.coerce.boolean()`，`Boolean("false")` 会让开关静默翻转。
- `zod` 版本走 `catalog:backend`，升级只改 `pnpm-workspace.yaml`。

## 改动前读什么

- 行为规格：`shared-config` 能力，归档后位于 `openspec/specs/shared-config/spec.md`；索引见 [openspec/specs/](../../openspec/specs/)
- 同类源码包约束：[../vitest-config/CLAUDE.md](../vitest-config/CLAUDE.md)
- 文档同步规则：[../../.claude/rules/doc-sync.md](../../.claude/rules/doc-sync.md)
- 注释规则：[../../.claude/rules/code-comments.md](../../.claude/rules/code-comments.md)

## 验证

- `pnpm --filter @workspace/config check-types`、`test`、`lint`、`format` 退出码 0。
- 改导出后跑消费方：`pnpm --filter backend check-types`、`pnpm --filter bff check-types`。
- 改运行时代码后用 Node 直接 import 一次本包，确认类型剥离能加载：`node --input-type=module -e "await import('@workspace/config')"`。
- `pnpm --filter backend start:prod` / `pnpm --filter bff start:prod` 能启动，确认 Nest `dist` 运行时链路正常。
