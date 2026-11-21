# Proposal

## Why

仓库的 Claude 全局资源在会话启动时全量注入：`.claude/rules/` 两个规则与 shadcn 类 skill 与大多数会话无关，却始终占启动上下文；同时 shadcn / migrate-radix-to-base 只服务于 `packages/ui`，却放在仓库根，资源没有放对位置。毕设进入实现期，会话数量增多，启动上下文需要瘦身，资源归属需要归位。

## What Changes

- `.claude/rules/code-comments.md` 增加 `paths:` 前置元数据，限定到代码文件（`*.ts` / `*.tsx` 等），改为按需加载；规则语义不变，对所有包统一生效。
- `.claude/rules/doc-sync.md` 拆两层：根 `CLAUDE.md` 的「文档同步」节保留一句话触发器（常驻）；`doc-sync.md` 全文加 `paths:` 限定到文档文件（`**/CLAUDE.md`、`**/README.md`、`**/AGENTS.md`、`openspec/**`、`doc/**`、`.github/**`），真正改文档时才注入全文。
- shadcn 与 migrate-radix-to-base 两个 skill 从 `.agents/skills/` 下沉到 `packages/ui/.claude/skills/`；接受 skill 升级时手动把新版从 `.agents/skills/` 搬到下沉位置。
- 根 `CLAUDE.md`「AI 协作配置」节同步更新资源位置说明。
- 明确不做：不建任何包级差异化 `.claude/settings.json` / agents / rules——技术栈统一，所有包要求一致；`openspec-*` skills、`opsx` command、`turborepo` skill 保持根目录不动。

## Capabilities

### New Capabilities

（无）

### Modified Capabilities

（无）

## Impact

- 受影响：`.claude/rules/`、`.agents/skills/`、新增 `packages/ui/.claude/skills/`、`skills-lock.json`（锁文件只记 source + hash，不记目标路径，升级工具可能重装回 `.agents/skills/`，下沉副本依赖手动同步）、根 `CLAUDE.md`。
- 不受影响：应用代码、构建 / 测试 / CI 流程、包级三份文档（README / CLAUDE / AGENTS）的内容语义。
- 已知权衡：doc-sync 全文按需加载后，编辑 `turbo.json` 等触发文件时全文不在场，依赖根 CLAUDE.md 常驻触发器提示同步义务。
