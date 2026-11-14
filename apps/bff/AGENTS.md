# AGENTS.md

`apps/bff` 是独立 BFF（NestJS 12 + ESM），监听 4000，只有 `GET /health`。

- 本包说明：[README.md](README.md)
- 本包 AI 规则：[CLAUDE.md](CLAUDE.md)
- 本地服务：[../backend/AGENTS.md](../backend/AGENTS.md)
- Lint / 格式化：`pnpm --filter bff lint` / `format`；根配置 `.oxlintrc.json` / `.oxfmtrc.json`
- 根规则：[../../AGENTS.md](../../AGENTS.md)、[../../CLAUDE.md](../../CLAUDE.md)
- 项目工作流：`openspec/`（OpenSpec 2.0）

边界：BFF 只做会话、SSE 与聚合，领域逻辑在 `apps/backend`。
