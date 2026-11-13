# CLAUDE.md

本文件是 `packages/typescript-config` 的包级规则。项目级规则见 [../../CLAUDE.md](../../CLAUDE.md)。

## 本包职责

`@workspace/typescript-config`：workspace 共享的 TypeScript 配置 profile。只有 JSON 与文档，没有源码、没有 build，也没有进程。

## 命令与端口

- 无端口、无 dev/build 脚本。
- 验证通过消费包进行：`pnpm exec tsc --showConfig -p apps/backend/tsconfig.json`，或仓库根 `pnpm check-types`。

## 目录与入口

- `base.json`：公共基线，被其余三个 profile `extends`。
- `nextjs.json`：`apps/frontend`。
- `react-library.json`：`packages/ui`。
- `nestjs.json`：`apps/backend`、`apps/bff`。

## 本包约束

- 只写无路径语义的 `compilerOptions`。`include` / `exclude` / `paths` / `outDir` / `rootDir` / `types` / `plugins` 一律留在消费包；放进本包会按 `packages/typescript-config/` 解析，指错位置。
- `base.json` 必须显式写 `target` / `module` / `moduleResolution` / `moduleDetection`。TypeScript 6.0 未写 `target` 时默认 `LatestStandard`，会随 TS 升级漂移。
- `lib` / `types` 在 `extends` 中是整组替换，不是合并；派生 profile 要写全自己需要的数组。
- Next 16 只要看到消费包 tsconfig 含 `extends` 就跳过自动写入，所以 `apps/frontend` 必须自己保留 `plugins`、`next-env.d.ts` 与 `.next/**/*.ts` 的 include。
- 仓库根没有 `@types/node`，`types: ["node"]` 只能写在 `apps/backend` / `apps/bff` 各自的 tsconfig。
- 不给 tsconfig 加远程 `$schema`，按 [../../CLAUDE.md](../../CLAUDE.md) 的 JSON Schema 约定。
- 不把 ESLint / Prettier / Vitest 配置搬进来。

## 改动前读什么

- 文档同步规则：[../../.claude/rules/doc-sync.md](../../.claude/rules/doc-sync.md)
- 仓库结构与包清单：[../../CLAUDE.md](../../CLAUDE.md)
- 包本地说明：[README.md](README.md)

## 验证

- `pnpm exec tsc --showConfig -p <package>/tsconfig.json` 能看到期待的继承值，且本地 `include` / `paths` 仍在。
- `pnpm check-types` 退出码 0。
- 改 profile 后至少跑一次 `pnpm --filter frontend build`、`pnpm --filter backend build`、`pnpm --filter bff build`。
