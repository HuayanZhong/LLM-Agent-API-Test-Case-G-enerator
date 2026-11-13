# Proposal

## Why

根目录的 `README.md`、`CLAUDE.md`、`AGENTS.md` 承担了全部项目说明，agent 进入某个包时仍要读上百行才能找到本包命令与边界；`apps/backend`、`apps/bff`、`packages/ui` 也没有任何入口文件。与此同时，Next 16 会自动在 `apps/frontend` 写入 `AGENTS.md` 托管块，如果不定下规则，后续维护会和自动生成内容冲突。

## What Changes

- 为每个 workspace 包补齐三份文件：
  - `apps/frontend/`：`README.md`、`CLAUDE.md`；`AGENTS.md` 由 Next 托管块 + 我们的索引内容组成。
  - `apps/bff/`、`apps/backend/`、`packages/ui/`：`README.md`、`CLAUDE.md`、`AGENTS.md` 各一份。
- 包级文件只写本地事实：职责、入口、命令、端口、依赖 catalog、本包特有约束，以及指回根规则的链接。不复制根规则正文。
- 根目录三份文件各补一节「包级文档」，说明四包入口的位置与分工。
- 更新 `.claude/rules/doc-sync.md`：把包级三份文件纳入同步目标与收尾检查。
- 更新 `openspec/config.yaml` 的 `context`，记录包级文档约定。

## Capabilities

### New Capabilities

无。本次是文档与协作配置变更，不改变系统行为；`.openspec.yaml` 已声明 `skip_specs: true`。

### Modified Capabilities

无。

## Impact

- 新增：`apps/frontend/README.md`、`apps/frontend/CLAUDE.md`；`apps/bff/{README,CLAUDE,AGENTS}.md`；`apps/backend/{README,CLAUDE,AGENTS}.md`；`packages/ui/{README,CLAUDE,AGENTS}.md`
- 修改：根 `README.md`、`CLAUDE.md`、`AGENTS.md`；`.claude/rules/doc-sync.md`；`openspec/config.yaml`
- 不改：代码、依赖、端口、构建流程
- 风险点：`apps/frontend/AGENTS.md` 的托管块由 `next dev` 重写，我们的内容必须放在标记外
