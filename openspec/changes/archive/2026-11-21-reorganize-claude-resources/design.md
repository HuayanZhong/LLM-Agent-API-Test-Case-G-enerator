# Design

## Context

Claude Code 对嵌套资源的加载语义（官方 monorepo 指南）：子目录 `CLAUDE.md` / 嵌套 `.claude/skills/` 按需加载（Claude 读写该子树文件时注入）；`.claude/rules/*.md` 带 `paths:` 前置元数据的按文件命中加载，不带的启动即载；嵌套 `.claude/settings.json` 只作用于所在子目录。现状资源清单与动机见 proposal.md。

## Goals / Non-Goals

**Goals:**

- 常驻启动上下文只留全局必需项：根 CLAUDE.md、一句话 doc-sync 触发器、openspec / turborepo 资源。
- 代码规则与文档规则按文件命中注入；UI 专属 skill 只在 `packages/ui` 子树可见。
- 所有规则对所有包语义统一，仅加载时机变化。

**Non-Goals:**

- 不建包级 `.claude/settings.json` / agents / rules（技术栈统一，要求一致）。
- 不改任何应用代码、构建、测试、CI。
- 不调整 `openspec-*` skills、`opsx` command、`turborepo` skill 的位置。
- 不引入新的 skill 同步工具链；`skills-lock.json` 机制保持原样。

## Decisions

1. **rules 按需化用 `paths:` 元数据，而不是拆成包级 rules。**
   替代方案是为各包建 `.claude/rules/`，那属于行为差异化，已被否决。`paths:` 只改变加载时机，不改变作用范围，语义与「统一技术栈、统一要求」一致。

2. **doc-sync 拆两层：触发器常驻 + 全文按需。**
   doc-sync 的触发条件是语义的（改了命令 / 端口 / 依赖…），不是文件类型的，所以全文 `paths:` 限定到文档文件必然出现「编辑 turbo.json 时全文不在场」。拆层后根 CLAUDE.md「文档同步」节的一句话触发器常驻提示同步义务，全文在真正动文档文件那一刻注入，闭环成立。替代方案：整体保持启动加载（零风险但收益减半）或整体 paths（触发器也消失，闭环保不住）——都不取。

3. **shadcn / migrate-radix-to-base 下沉到 `packages/ui/.claude/skills/`，不是 `apps/frontend/.claude/skills/`。**
   组件实体与样式全在 packages/ui；`shadcn add -c apps/frontend` 只是安装入口，产物写入 packages/ui。挂在 apps/frontend 会让碰组件的会话（通常在 packages/ui）反而不触发加载。

4. **`skills-lock.json` 保留在根、不改结构。**
   它锁定升级来源与 hash，不记录目标路径。实测后收紧（见决策 5）：两个下沉 skill 的锁条目已随 `skills remove` 一并移除，锁文件只剩 `turborepo`。

5. **`.agents/skills/` 中被下沉的两个 skill 目录最终删除（原定保留，实测后推翻）。**
   实测证据：① 保留时根会话 skills 清单仍列出 shadcn / migrate-radix-to-base（`claude -p` 真实新会话确认，来源 `.agents/skills/`），「根会话不可见」目标不达成；② `skills` CLI 1.8.1 的 `experimental_install` 语义就是「从锁文件恢复」，目录缺失是预期状态，`remove` 可正规卸载，A1 无工具链风险；③ `packages/ui` 子树会话已实测裸名可见下沉副本，不依赖 `.agents` 基线。升级流程：`pnpm exec skills add shadcn-ui/ui` 重装到 `.agents/skills/` → 手动搬到 `packages/ui/.claude/skills/` → `pnpm exec skills remove <skill>` 清掉 `.agents` 副本与锁条目。

## Risks / Trade-offs

- [doc-sync 全文不在场导致漏同步] → 根 CLAUDE.md 常驻触发器兜底；同步义务的一句话摘要不删。
- [skill 升级后下沉副本过期] → tasks 固化「升级后手动搬 + 对比 hash」检查项。
- [嵌套 skill 自动发现在个别 Claude Code 版本失效（官方 issue #40640）] → 实现后开新会话验证 `packages/ui` 子树内 skill 可见、子树外不可见。
- [paths glob 覆盖不全（如漏掉 `*.mts` / 根配置文件）] → glob 按仓库实际文件后缀取并集，实现时用 Glob 盘点校验。

## Migration Plan

单次提交完成全部移动与文档同步，无灰度；回滚 = git revert 该提交。验证入口：新会话资源盘点 + `pnpm format:root`（`skills-lock.json` 在其检查范围内）。

## Open Questions

无——锁文件校验逻辑的测定点已归入 tasks 的实现步骤，不阻塞方案。
