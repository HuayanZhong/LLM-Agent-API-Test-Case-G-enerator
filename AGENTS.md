# AGENTS.md

本仓库的 AI 协作入口。规则正文不在这里重复，统一指向：

- 项目说明、命令与架构约束：[CLAUDE.md](CLAUDE.md)
- 代码注释规则：[.claude/rules/code-comments.md](.claude/rules/code-comments.md)
- 文档同步规则：[.claude/rules/doc-sync.md](.claude/rules/doc-sync.md)
- OpenSpec 工作流：`openspec/`，技能在 `.agents/skills/openspec-*`，命令 `/openspec-propose` 等；快捷入口 `/opsx`
- MCP 配置：`.mcp.json`（chrome-devtools 固定版本 + Storybook HTTP 端点）
- 应用骨架：`apps/frontend`（3000，Next.js，`src/`）、`apps/bff`（4000）、`apps/backend`（5000）；共享 UI 在 `packages/ui`（`@workspace/ui`），共享 tsconfig 在 `packages/typescript-config`，见 [CLAUDE.md](CLAUDE.md)
- 包级入口：`apps/frontend`、`apps/bff`、`apps/backend`、`packages/ui`、`packages/typescript-config` 各有一份 `README.md` / `CLAUDE.md` / `AGENTS.md`；进入包内先读该包 `CLAUDE.md`
- Storybook 与 MCP：`packages/ui`（6006），端点为 `http://127.0.0.1:6006/mcp`，仅 dev 时可用；见 [packages/ui/CLAUDE.md](packages/ui/CLAUDE.md)
- 类型检查：`pnpm check-types`（Turbo）；profile 与约束见 [packages/typescript-config/CLAUDE.md](packages/typescript-config/CLAUDE.md)
- 设计文档索引：[doc/README.md](doc/README.md)

修改规则时改上面三处，不要在多份文件里各写一套。
