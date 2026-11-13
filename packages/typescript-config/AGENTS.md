# AGENTS.md

`packages/typescript-config` 是 workspace 共享的 TypeScript 配置包（`@workspace/typescript-config`），只含 profile 与文档。

- 本包说明：[README.md](README.md)
- 本包 AI 规则：[CLAUDE.md](CLAUDE.md)
- 根规则：[../../AGENTS.md](../../AGENTS.md)、[../../CLAUDE.md](../../CLAUDE.md)
- 消费示例：`apps/frontend`、`apps/backend`、`apps/bff`、`packages/ui` 各有一份 tsconfig
- 项目工作流：`openspec/`（OpenSpec 2.0）

只提取无路径语义的 compilerOptions；`include` / `paths` / `outDir` / `types` / `plugins` 不要搬进来。
