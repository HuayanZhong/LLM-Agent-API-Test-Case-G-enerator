# AGENTS.md

本仓库的 AI 协作入口。规则正文不在这里重复，统一指向：

- 项目说明、命令与架构约束：[CLAUDE.md](CLAUDE.md)
- 代码注释规则：[.claude/rules/code-comments.md](.claude/rules/code-comments.md)
- 文档同步规则：[.claude/rules/doc-sync.md](.claude/rules/doc-sync.md)
- OpenSpec 工作流：`openspec/`，技能在 `.agents/skills/openspec-*`，命令 `/openspec-propose` 等；快捷入口 `/opsx`
- MCP 配置：`.mcp.json`（chrome-devtools，固定版本）
- 设计文档索引：[doc/README.md](doc/README.md)

修改规则时改上面三处，不要在多份文件里各写一套。
