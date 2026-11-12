# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 仓库现状

设计优先的本科毕设项目：基于大模型智能体的接口测试用例辅助生成系统。当前仓库是 **pnpm workspace + 设计文档的脚手架**：`apps/` 与 `packages/` 下还没有源码，不要假设存在可运行代码、测试或构建产物。

## 常用命令

在仓库根目录执行：

```bash
pnpm install
pnpm dev      # 根脚本：turbo run dev
```

- 工作区命令：`pnpm --filter <workspace-name> <script>`。
- `turbo.json` 与根 `package.json` 目前都只暴露 `dev`（`persistent: true`、`cache: false`）；build / lint / test 尚未接入，后续需要时再加。
- 依赖版本统一放 `pnpm-workspace.yaml` 的 `catalogs`；根 `package.json` 用 `catalog:tooling` 引用 Turbo。pnpm 不接受空分类，未使用的分类先用注释占位。
- 目前没有任何 workspace 定义 `dev`；根 `dev` 会运行 Turbo，但没有可执行的工作区任务。
- 还没有测试框架，因此没有“跑单个测试”的命令；后续加入测试后再补 scoped script。

**版本口径**：Node.js >= 26.12.1、pnpm >= 12.18.0，以 `package.json` 的 `engines` 为准（README 已对齐）。

## 仓库结构

```text
apps/frontend/   规划中的 Electron + Next.js/React + shadcn/ui 桌面端（空）
apps/bff/        规划中的 Next Route Handlers 薄 BFF（空）
apps/backend/    规划中的 NestJS 本地服务（空）
packages/        规划中的共享包（空）
doc/             当前设计的事实来源
```

`doc/README.md` 是阅读索引。HTML 是交付物；`doc/source/*.candidate.json` 是可编辑的 Archify 源文件；`doc/_evidence/` 是生成的回执、截图与历史迭代，不作为设计输入，可整体删除。

## 规划技术栈（来自设计文档，尚未实现）

- 桌面端：Electron 壳、Next.js + React + shadcn/ui、薄 BFF。
- 后端：NestJS 本地运行；LangGraph.js 编排 Agent，LangChain.js 接模型，Zod 定义 Case IR 与结构化输出。
- 执行：`ky` 发请求 + Vitest 断言；`chrome-devtools` MCP 只做页面采集，不承担批量接口执行。
- 数据：Supabase（Postgres、pgvector、Auth、Storage）经 MikroORM 访问；GraphRAG 用邻接表 + 递归 CTE 配合 pgvector；OKF 文档放 Storage。
- 协同：A2A 负责任务派发与状态回传；Deep Agents 是可选增强，不进主架构。

## 代码注释

遵循 [.claude/rules/code-comments.md](.claude/rules/code-comments.md)：只注释关键决策、边界与外部依赖；每条短句，写「为什么」；默认偏多写关键点，但不要复述代码。跨工具入口见 [AGENTS.md](AGENTS.md)。

## JSON Schema 约定

- 优先使用依赖包自带的本地 schema，例如 `turbo.json` 的 `./node_modules/turbo/schema.json`；升级依赖时 schema 随包同步升级。
- 不要使用未版本化的远程 schema（如 `https://turbo.build/schema.json`）。远程地址会独立更新，容易和已安装 CLI 版本漂移；VSCode 还会因域名不受信任而报错。
- 标准生态 schema（GitHub Actions、Docker Compose 等）可以用 schemastore 或版本化 URL；需要时把域名加入 VSCode 的 `json.schemaDownload.trustedDomains`。
- `tsconfig.json`、ESLint、Prettier、Next/Nest 配置通常不需要 `$schema`，不要为了消警告硬加远程 schema。

## 架构约束

- 业务架构四层：参与角色与输入 → 智能体处理 → 判定依据 → 结果分流，双出口（报告 / 知识）。能力层是“测试用例生成”这一格的放大视图，不要把它抬成系统中心。
- 系统只诊断与复验，不改代码、不给修复方案；测试报告是唯一交付物，关键节点由人确认。
- 图中的措辞是书面化的（“结果比对与判定”“正常现场记录”）。底层需求仍然包含页面采集、记录正常现场（接口 + 测试数据 + 正常状态）、必要时按记忆重放复现；写论文正文时不要把这些具体点抽象掉。

## 重新生成图

HTML 由用户级 Archify skill 生成：`C:/Users/Administrator/.claude/skills/archify/bin/archify.mjs`。改 `doc/source/` 里的 candidate，不要手改 HTML。在仓库根目录执行：

```bash
ARCHIFY="C:/Users/Administrator/.claude/skills/archify/bin/archify.mjs"

node "$ARCHIFY" finalize architecture "doc/source/business-architecture.candidate.json"   "doc/business-architecture.html"   --quality showcase --out-dir "doc/_evidence/review-business" --json
node "$ARCHIFY" finalize architecture "doc/source/technical-architecture.candidate.json" "doc/technical-architecture.html" --quality showcase --out-dir "doc/_evidence/review-technical" --json
node "$ARCHIFY" finalize dataflow    "doc/source/rag-dataflow.candidate.json"            "doc/rag-dataflow.html"            --quality showcase --out-dir "doc/_evidence/review-rag" --json
node "$ARCHIFY" finalize lifecycle   "doc/source/a2a-lifecycle.candidate.json"           "doc/a2a-lifecycle.html"           --quality showcase --out-dir "doc/_evidence/review-a2a" --json
node "$ARCHIFY" finalize erd         "doc/source/erd-core.candidate.json"                "doc/erd-core.html"                --quality standard --out-dir "doc/_evidence/review-erd-core" --json
node "$ARCHIFY" finalize erd         "doc/source/erd-knowledge.candidate.json"           "doc/erd-knowledge.html"           --quality standard --out-dir "doc/_evidence/review-erd-knowledge" --json
```

- 非零退出即失败，不要声称 HTML 已更新。
- `finalize` 的浏览器证据与产物绑定；重跑已有 HTML 时换新的 `--out-dir`（如 `review-business-2`），不要复用上一次的目录。
- 可选视觉证据：`node "$ARCHIFY" visual-check "doc/<name>.html" --out-dir "doc/_evidence/visual-<name>" --summary --require-provenance`。
- Archify 不是仓库依赖；skill 不可用时 HTML 仍可打开，但不能重新生成。

仓库中没有 Cursor 或 Copilot 规则文件。
