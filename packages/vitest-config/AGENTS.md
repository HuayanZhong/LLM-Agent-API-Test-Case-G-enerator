# AGENTS.md

`packages/vitest-config` 是 workspace 共享的 Vitest 配置包（`@workspace/vitest-config`），只含 `base` / `react` 两个 profile 与文档。

- 本包说明：[README.md](README.md)
- 本包 AI 规则：[CLAUDE.md](CLAUDE.md)
- 根规则：[../../AGENTS.md](../../AGENTS.md)、[../../CLAUDE.md](../../CLAUDE.md)
- 消费方：`apps/backend`、`apps/bff`、`apps/frontend`、`packages/ui` 各有一份 `vitest.config.ts`
- Lint / 格式化：`pnpm --filter @workspace/vitest-config lint` / `format`；根配置 `.oxlintrc.json` / `.oxfmtrc.json`
- 项目工作流：`openspec/`（OpenSpec 2.0）

只放无路径语义的 `test` 选项；`include` / `setupFiles` / `coverage.include` 不要搬进来。
