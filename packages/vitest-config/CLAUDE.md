# CLAUDE.md

本文件是 `packages/vitest-config` 的包级规则。项目级规则见 [../../CLAUDE.md](../../CLAUDE.md)。

## 本包职责

`@workspace/vitest-config`：workspace 共享的 Vitest profile（`base` / `react`）。只有一份源码与文档，没有 build、没有进程、没有端口。

## 命令与端口

- 无端口、无 dev/build 脚本。
- `pnpm --filter @workspace/vitest-config check-types` 做本包类型检查。
- 消费侧验证：`pnpm --filter backend test`、`pnpm --filter bff test`、`pnpm --filter frontend test`、`pnpm --filter @workspace/ui test`；仓库根是 `pnpm test`。

## 目录与入口

- `src/index.ts`：`base`（Node 环境）与 `react`（jsdom）；`react` 用对象展开复用 `base`。
- `package.json` 的 `exports` 指向 `./src/index.ts`，TypeScript 与 Node 都按这个入口解析。

## 本包约束

- 包内**不写相对 import**。Node 的 ESM 不会把 `./base.js` 改写成 `./base.ts`；写 `./base.ts` 又要求消费方开启 `allowImportingTsExtensions`，而 Nest 的 `nest build` 会 emit，不能开。profile 多了就继续用对象展开，不要拆文件。
- 只写无路径语义的 `test` 选项。`include` / `setupFiles` / `coverage.include` / `coverage.exclude` 留在消费包；Vitest 用包根解析这些路径。
- 覆盖率公共项只在这里：`provider: "v8"`、`reporter: ["text", "html"]`、`thresholds: { lines: 95 }`。`coverage.enabled` 不打开，交给各包 `test` 脚本的 `--coverage`。
- 不把 `globals: true` 放进 profile。测试文件显式 `import`，也避免 `vitest/globals` 与 `nest build` 的老问题。
- 本包以 `.ts` 源码加载，依赖 Node 26 类型剥离与 pnpm 符号链接；不要把包目录复制进 `node_modules`，也不要把 `exports` 改到 `dist`。
- 不引入 `@storybook/addon-vitest`、Playwright、oxlint、Prettier；这些由后续变更处理。

## 改动前读什么

- 文档同步规则：[../../.claude/rules/doc-sync.md](../../.claude/rules/doc-sync.md)
- 共享 tsconfig 包的同类边界：[../typescript-config/CLAUDE.md](../typescript-config/CLAUDE.md)
- 包本地说明：[README.md](README.md)

## 验证

- `pnpm --filter @workspace/vitest-config check-types` 退出码 0。
- 改 profile 后跑四个包的 `test`，确认行覆盖率仍 ≥ 95%，且 `functions` / `branches` / `statements` 正常出现在报告里。
- 仓库根 `pnpm check-types` 退出码 0（消费方会类型检查本包源码）。
