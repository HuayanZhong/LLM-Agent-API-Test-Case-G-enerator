# AGENTS.md

`packages/config` 是 workspace 的环境变量解析与校验包（`@workspace/config`），运行时工具，无构建。

- 本包说明：[README.md](README.md)
- 本包 AI 规则：[CLAUDE.md](CLAUDE.md)
- 根规则：[../../AGENTS.md](../../AGENTS.md)、[../../CLAUDE.md](../../CLAUDE.md)
- 行为规格：`shared-config` 能力，归档后位于 `openspec/specs/shared-config/spec.md`；索引见 [openspec/specs/](../../openspec/specs/)
- 消费方：`apps/backend`、`apps/bff` 各自定义 schema；desktop / frontend 暂未接入
- Lint / 格式化：`pnpm --filter @workspace/config lint` / `format`；根配置 `.oxlintrc.json` / `.oxfmtrc.json`
- 项目工作流：`openspec/`（OpenSpec 2.0）

只放通用 env 能力；一个配置域一个自包含文件，包内不写相对 import；app 专属 schema 留在各自包。
