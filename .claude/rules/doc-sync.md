# 文档同步规则

目标：代码、配置、文档不脱节。文档过期按 bug 处理，不按“以后补”处理。

## 触发条件

满足任一条件即算“大改动”：

- 新增、删除、重命名 workspace 包，或改变 `apps/` / `packages/` 边界（同时增删该包的 `README.md` / `CLAUDE.md` / `AGENTS.md`）。
- 修改根 scripts、`turbo.json` 任务、启动 / 构建 / 测试方式。
- 变更依赖、catalog 分类、Node / pnpm 版本要求。
- 变更命令、端口、环境变量、进程启动顺序。
- 变更技术栈、架构分层、数据流或对外协议。
- 变更项目范围、当前状态或规划技术栈（OpenSpec context）。
- 变更行为规格、验收场景或 OpenSpec 工作流。
- 新增、移动规则文件、设计图或文档入口。
- 任何会让新成员或新 Agent 照旧文档做错事的改动。

## 必须同步的文件

| 改动 | 更新 |
|---|---|
| 定位、环境、安装 / 启动命令、目录结构 | `README.md` |
| Claude 的命令、架构约束、约定、路径 | `CLAUDE.md` |
| 跨工具入口、规则位置 | `AGENTS.md` |
| 图或文档新增、重命名、阅读顺序 | `doc/README.md` |
| 规则本身 | `.claude/rules/*.md` |
| 包职责、命令、端口、目录边界 | 对应包的 `README.md` |
| 包级 AI 规则、坑、验证命令 | 对应包的 `CLAUDE.md` |
| 包级跨工具入口 | 对应包的 `AGENTS.md` |
| 项目范围、状态、技术栈 | `openspec/config.yaml` 的 `context` |
| 行为规格、验收场景 | `openspec/specs/`（通过 OpenSpec 变更 / 归档更新） |

## 做法

- 在同一次改动内完成，不留在“以后补”。
- 先改事实来源（代码 / 配置），再同步文档；命令要实际跑过。
- 文档只写当前有效状态；过期内容删除或标明废弃，不堆历史。
- 同一事实只保留一个权威位置，其他文档用链接，不复制。
- 提交前检查：README 的命令能跑、CLAUDE 的路径存在、AGENTS 的入口有效、`doc/README.md` 的链接可达。
- 如果判断不需要更新，在提交说明或回复里写一句“文档无需更新，因为……”，不要沉默。

## 包级文档

每个 workspace 包在包根目录放三份文件；新增包时一起创建，删除包时一起删除。

| 文件 | 写什么 | 不写什么 |
|---|---|---|
| `README.md` | 包职责、运行与构建、目录、依赖 catalog、边界、相关链接 | 项目定位、系统红线 |
| `CLAUDE.md` | 本包职责、命令与端口、目录入口、本包约束 / 坑、改动前必读、验证命令 | OpenSpec 全流程、注释规则全文 |
| `AGENTS.md` | 8–12 行索引：同包 README / CLAUDE、根规则、工作流入口 | 任何重复正文 |

固定章节：

- `README.md`：职责 / 运行 / 目录 / 依赖与边界 / 相关文档
- `CLAUDE.md`：本包职责 / 命令与端口 / 目录与入口 / 本包约束 / 改动前读什么 / 验证
- `AGENTS.md`：一句本包说明 + 链接列表

规则：

- 包 README 是包本地事实（命令、端口、边界）的权威位置；根 README 只做聚合与链接，冲突时以包 README 为准。
- 包级文件不复制根规则正文，用链接指回根 `CLAUDE.md` / `AGENTS.md` 与 `.claude/rules/`。
- `apps/frontend/AGENTS.md` 含 Next 托管的 `nextjs-agent-rules` 块；我们的索引内容放在标记上方，不编辑标记内部。

## 收尾检查

每次大改动结束前：

- 跑 `pnpm exec openspec validate --all`；归档变更后确认 `openspec/specs/` 已更新。
- 确认 `openspec/config.yaml` 的 `context` 仍与项目现状一致（范围、状态、技术栈）。
- README 的命令能跑、路径存在；CLAUDE / AGENTS 的入口有效；`doc/README.md` 的链接可达。
- 每个 workspace 包的三份文件存在，包级相对链接可达，端口与 `package.json` / `main.ts` 一致。
- 过期内容已删除或标为废弃；旧命令、旧路径没有残留。

## 审查清单

- 有没有新增、改名或删除命令、脚本、任务？
- 有没有依赖、版本、catalog 变化？
- 有没有目录、入口或规则文件移动？
- 有没有 OpenSpec 上下文或规格变化？
- README / CLAUDE / AGENTS / doc/README / openspec 是否仍指向真实路径？
- 旧说法是否删除或标为废弃？
