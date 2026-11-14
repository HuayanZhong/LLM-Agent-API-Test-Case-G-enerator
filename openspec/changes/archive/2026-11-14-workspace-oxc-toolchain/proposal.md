## Why

仓库目前没有 lint，也没有格式化：Nest 骨架沿用单引号 + 分号，前端与 `packages/ui` 是 shadcn 风格的双引号 + 无分号，根命令里也没有质量门禁。tsconfig 与 Vitest 已经接入，下一步需要把「写完代码怎么检查」补齐。Oxc 的 `oxlint` / `oxfmt` 可以在不引入 ESLint / Prettier 依赖树的前提下提供 lint 与格式化能力，并且与现有 Vite 8 的 Oxc 转换链同源。

## What Changes

- 根目录新增 `.oxlintrc.json`：启用 Oxc 内置插件（`typescript`、`unicorn`、`oxc`、`import`、`react`、`jsx-a11y`、`nextjs`、`vitest`、`node`、`promise`），只开 `correctness` 类别，按官方推荐用 `ignorePatterns` 排除技能资产、设计文档与 OpenSpec 目录。
- 根目录新增 `.oxfmtrc.json`：采用 Oxfmt 默认排版（`printWidth: 100`、双引号、`trailingComma: "all"`），按已确认的基线设置 `semi: false`，关闭 `sortPackageJson`，暂不启用 import / Tailwind 排序；Markdown 不纳入本次格式化。
- 根 `package.json` 只保留 `turbo run` 包装脚本；每个 workspace 包增加 `lint`、`lint:fix`、`format`、`format:fix` 脚本，根命令一次跑所有包。`turbo.json` 增加对应的 `lint` / `format` 任务，fix 任务不缓存；根 Oxc 配置变更通过 `globalDependencies` 失效缓存。
- `pnpm-workspace.yaml` 的 `tooling` catalog 增加 `oxlint`、`oxfmt`，根 `devDependencies` 用 `catalog:tooling` 引用。
- 用 `oxfmt` 对现有 TS / TSX / JSON / CSS / YAML 做一次性格式化；修复 oxlint 命中的两个真实问题，并按包边界收敛 Next.js 规则。
- 同步更新 `README.md`、`CLAUDE.md`、`AGENTS.md`、各 workspace 包文档与 `openspec/config.yaml` 的 `context`。

**不包含**：Nest 构建继续用 tsc，不引入 `oxc-transform`；不启用 oxlint type-aware（官方文档要求 TypeScript 7.0+，当前仓库是 6.0.3）；不引入 ESLint、Prettier、lint-staged；不格式化 Markdown。

## Capabilities

无 spec 级行为变更。本次只改工具链、配置与命令，不改变系统对外行为；按 `.openspec.yaml` 的 `skip_specs: true` 跳过 specs 产物。

## Impact

- 配置：新增 `.oxlintrc.json`、`.oxfmtrc.json`；修改根 `package.json`、`turbo.json`、`pnpm-workspace.yaml`、`pnpm-lock.yaml`。
- 代码：`pnpm format:fix` 会格式化 `apps/backend`、`apps/bff`、`apps/frontend`、`packages/ui`、`packages/vitest-config` 及根 / 包级 JSON、YAML、CSS；不改 Markdown。
- 修复：`packages/ui/vitest.config.ts` 的未使用导入；`packages/ui/__tests__/utils.test.ts` 的常量表达式；`packages/ui` 中 Next.js 规则误报。
- 文档：根 `README.md` / `CLAUDE.md` / `AGENTS.md`、六个 workspace 包的本地文档、`openspec/config.yaml`。
- 风险：Oxfmt 仍是 0.x（alpha），靠 catalog + lockfile 固定版本；一次性格式化会产生较大 diff，但不改变运行行为，需用 `check-types`、`test` 与三个 build 回归。
