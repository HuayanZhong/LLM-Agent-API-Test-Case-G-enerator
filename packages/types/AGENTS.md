# AGENTS.md

`packages/types` 是 workspace 的共享类型包（`@workspace/types`），只含跨应用只读契约，没有运行时值。

- 本包说明：[README.md](README.md)
- 本包 AI 规则：[CLAUDE.md](CLAUDE.md)
- 根规则：[../../AGENTS.md](../../AGENTS.md)、[../../CLAUDE.md](../../CLAUDE.md)
- 行为规格：`shared-types` 能力，归档后位于 `openspec/specs/shared-types/spec.md`；索引见 [openspec/specs/](../../openspec/specs/)
- 消费方：`apps/desktop`、`apps/bff`、`apps/backend`、`apps/frontend`
- Lint / 格式化：`pnpm --filter @workspace/types lint` / `format`；根配置 `.oxlintrc.json` / `.oxfmtrc.json`
- 项目工作流：`openspec/`（OpenSpec 2.0）

只收跨进程只读形状；按 `api/`、`bridge/` 分层，层间不互相 import；controller 入参 DTO、主进程内部契约与运行时值不进本包。
