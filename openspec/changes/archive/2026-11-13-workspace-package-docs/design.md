# Design

## Context

见 `proposal.md` 的 Why。当前约束：

- 根 `README.md`（102 行）与 `CLAUDE.md`（109 行）已经很长；`AGENTS.md` 是 13 行的纯索引。
- 四个 workspace 包：`apps/frontend`、`apps/bff`、`apps/backend`、`packages/ui`。
- `apps/frontend/AGENTS.md` 由 Next 16 的 `generate-agent-files.js` 托管：文件存在时在末尾追加 `<!-- BEGIN:nextjs-agent-rules -->` 块，已有标记时只替换块内内容，块外内容保留。
- `.claude/rules/doc-sync.md` 要求「同一事实只保留一个权威位置，其他文档用链接，不复制」。
- Claude Code 读取 `CLAUDE.md` 时按目录层级生效；agent 进入某个包时，同目录的 `CLAUDE.md` 才有价值。

## Goals / Non-Goals

**Goals:**

- 每个包都能从本地三份文件回答：这是什么、怎么跑、边界在哪、改动前读什么。
- 根文档保持单一全局事实来源，包文档只补局部事实。
- 同一套文件名与章节顺序，新包可以直接照抄。
- Next 自动生成的块与我们的内容共存，不互相覆盖。

**Non-Goals:**

- 不重构根 `CLAUDE.md` 的现有章节。
- 不引入文档生成器或 lint 工具。
- 不为将来还没落地的包（如 `packages/agent`、`packages/shared`）预建目录。
- 不把包 README 写成对外发布文档。

## Decisions

### D1. 三份文件各司其职

| 文件 | 读者 | 内容 |
|---|---|---|
| `README.md` | 人 / 新成员 | 包职责、技术栈、运行与构建、目录、依赖边界、相关文档 |
| `CLAUDE.md` | Claude Code | 本包局部规则、启动验证命令、坑与约束、改动前必读 |
| `AGENTS.md` | 跨工具 agent | 短索引：本包是什么、三份文件在哪、根规则链接 |

理由：三种工具的加载方式不同，职责分开才能各取所需。`AGENTS.md` 保持 8–12 行，避免和另外两份重复。

备选：三份都写完整内容。12 份文件会产生大量重复，违反 doc-sync，否决。

### D2. 包级 README 是包本地事实的权威位置

包 README 负责本包的 scripts、端口、入口、依赖 catalog。根 README 的端口表是聚合视图，必须链接到各包 README；两者冲突时以包 README 为准。

理由：最接近事实的文档才不容易过期；根表只做导航。

备选：根 README 权威、包 README 链接。缺点是改端口要回到根文档，违背“就近维护”。

### D3. 包级 CLAUDE.md 只写“不写就会做错”的内容

每份控制在 20–35 行，章节固定：

1. 本包职责（2–3 行）
2. 命令与端口
3. 目录与入口
4. 本包约束 / 坑
5. 改动前读什么（链接）
6. 验证命令

不写项目定位、系统红线、OpenSpec 全流程、注释规则全文；这些链接到根 `CLAUDE.md`。

### D4. 包级 AGENTS.md 是索引，不是第二份 CLAUDE

固定 8–12 行：一句本包说明 + 指向同目录 `README.md` / `CLAUDE.md` + 指向根 `AGENTS.md` 与 `.claude/rules/`。与根 `AGENTS.md` 同样的“只指路、不复制”风格。

### D5. `apps/frontend/AGENTS.md` 的结构

```markdown
# AGENTS.md

<我们的索引内容，8 行左右>

<!-- BEGIN:nextjs-agent-rules -->
... Next 托管内容 ...
<!-- END:nextjs-agent-rules -->
```

理由：`upsertAgentRulesBlock` 找不到标记时会把块追加到文件末尾；找到标记时只替换块内内容。我们的内容放在标记上方即可长期保留。

约束：不要移动或删除标记；不要让工具把我们的内容写进标记内部。

### D6. 章节模板写进 doc-sync 规则，不新建模板文件

在 `.claude/rules/doc-sync.md` 增加“包级文档”小节，列出三份文件的固定章节与最小行数要求。

理由：规则文件已经是文档维护的权威位置，再建 `.claude/templates/` 会多一个入口。

### D7. 根文档的改动范围

- 根 `README.md`：新增「包级文档」一节，四行链接 + 一句权威说明。
- 根 `CLAUDE.md`：仓库结构后新增「包级文档」小节，说明何时读包级文件。
- 根 `AGENTS.md`：索引里新增四包三份文件的位置。

## Risks / Trade-offs

- [12 份文件产生重复，后续漂移] → 包文档只写局部事实；doc-sync 增加包级检查项；根表链接到包 README。
- [Next 重写 `apps/frontend/AGENTS.md` 时误删我们的内容] → 内容放在托管标记外；任务里实际跑一次 `next dev` 验证。
- [包级 CLAUDE.md 太薄，agent 仍要回根文档] → 接受一次跳转；总阅读量比读完整根文档少。
- [新包忘记建三份文件] → doc-sync 的“新增 workspace 包”触发条件里显式列出三份文件。
- [包 README 与根 README 端口冲突] → D2 明确包 README 优先，根表加链接。

## Migration Plan

1. 先写四个包的三份文件；内容以当前代码与 package.json 为准。
2. 再改根三份文件的索引节。
3. 更新 `.claude/rules/doc-sync.md` 与 `openspec/config.yaml` context。
4. 验证：文件存在、链接可达、`next dev` 后 `apps/frontend/AGENTS.md` 仍保留我们的内容。
5. 回滚：删除新增文件、还原根三份与规则文件；不涉及代码与依赖。
