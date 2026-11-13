# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 仓库现状

设计优先的本科毕设项目：基于大模型智能体的接口测试用例辅助生成系统。当前仓库已有 `apps/frontend` 的 Next.js 16 骨架、`packages/ui` 的共享组件包，以及 `apps/backend`、`apps/bff` 两个 NestJS 12 骨架；业务模块、测试与 lint 尚未实现。

## 常用命令

在仓库根目录执行：

```bash
pnpm install
pnpm dev          # 根脚本：turbo run dev
pnpm check-types  # 根脚本：turbo run check-types
pnpm test         # 根脚本：turbo run test（行覆盖率 < 95% 失败）
pnpm test:watch   # 根脚本：turbo run test:watch
```

- 工作区命令：`pnpm --filter <workspace-name> <script>`。
- `turbo.json` 与根 `package.json` 暴露 `dev`（`persistent: true`、`cache: false`）、`check-types`（`dependsOn: ["^check-types"]`）、`test`（`outputs: ["coverage/**"]`）与 `test:watch`（persistent、不缓存）；各 app 自己仍有 `build` / `start`，Turbo 的 build / lint 尚未接入。
- 依赖版本统一放 `pnpm-workspace.yaml` 的 `catalogs`：`tooling`（Turbo、TypeScript、OpenSpec、shadcn）、`frontend`（Next、React、Tailwind 与 UI 依赖）、`backend`（NestJS）。包内用 `catalog:<name>` 引用。
- `pnpm-workspace.yaml` 的 `engineStrict: true` 会让 Node/pnpm 版本不符时直接失败，而不是只发警告。
- 三个 app 都定义了 `dev`；根 `pnpm dev` 通过 Turbo 并行启动 frontend（3000）、bff（4000）与 backend（5000）。
- 前端组件安装：在仓库根执行 `pnpm dlx shadcn@latest add <component> -c apps/frontend`；UI 组件写入 `packages/ui`，不要手动放到 `apps/frontend`。
- Storybook：`pnpm --filter @workspace/ui storybook`（6006）；MCP 端点 `http://127.0.0.1:6006/mcp` 仅 dev 运行时可用，当前为 docs + development 工具集。
- 测试框架是 Vitest 5：根 `pnpm test` 经 Turbo 并行跑四个包，行覆盖率门槛 95%（`coverage.thresholds.lines`）。单包 `pnpm --filter <pkg> test`，watch 用 `test:watch`。配置继承 `packages/vitest-config`，测试文件按官方约定：Nest 的 `src/**/*.spec.ts`、React 的 `__tests__/**/*.test.tsx`。

**版本口径**：Node.js >= 26.12.1、pnpm >= 12.18.0，以 `package.json` 的 `engines` 为准（README 已对齐）。

**环境变量**：根目录 `.env.example` 是唯一声明入口，当前保持为空；技术选型确认后再补变量。真实 `.env` / `.env.local` / `.env.*` 已被忽略。

## OpenSpec 工作流

本项目用 OpenSpec 2.0 做规格驱动开发。新功能或行为变更先提案、再实现、最后归档；`openspec/specs/` 是行为事实来源。

- 技能：`/openspec-explore`、`/openspec-propose <change>`、`/openspec-apply-change`、`/openspec-update-change`、`/openspec-archive-change`、`/openspec-sync-specs`（技能在 `.agents/skills/`，`.claude/skills/` 下是链接）。
- 快捷入口：`/opsx <explore|propose|apply|update|sync|archive>`，按第一个参数转发到上述技能。
- CLI：`pnpm exec openspec list`、`show`、`validate --all`、`status`、`archive`。
- 变更目录：`openspec/changes/<change>/`，含 proposal、specs、design、tasks；归档后进入 `changes/archive/`。
- 不要跳过 propose 直接写代码；人工确认计划后再 apply；归档前先 validate。
- `opsx` 是 OpenSpec 1.x 的旧命令前缀；2.0 使用 `/openspec-*`，技能描述里仍接受 “opsx propose” 这类说法。

## AI 协作配置

- `.mcp.json`：项目级 chrome-devtools MCP，固定 `chrome-devtools-mcp@1.13.0`，通过 `pnpm dlx` 启动。
- `.claude/commands/opsx.md`：`/opsx` 快捷入口。
- 不配置项目级 `.claude/settings.json`，权限沿用默认模式与全局设置。

## 仓库结构

```text
apps/frontend/   Next.js 16 + React 19 + Tailwind v4 骨架（3000，src/）
apps/bff/        NestJS 12 BFF 骨架（4000，GET /health）
apps/backend/    NestJS 12 本地服务骨架（5000，GET /health）
packages/ui/     共享 shadcn 组件、cn() 与 Tailwind 样式（@workspace/ui）
packages/typescript-config/  共享 tsconfig profile（@workspace/typescript-config）
packages/vitest-config/      共享 Vitest profile（@workspace/vitest-config）
doc/             当前设计的事实来源
```

`doc/README.md` 是阅读索引。HTML 是交付物；`doc/source/*.candidate.json` 是可编辑的 Archify 源文件；`doc/_evidence/` 是生成的回执、截图与历史迭代，不作为设计输入，可整体删除。

## 包级文档

进入某个包工作时，先读同目录 `CLAUDE.md`。包级文件只写本地事实（命令、端口、目录、坑），全局规则仍以本文件为准。

- `apps/frontend/CLAUDE.md`：Next App Router、shadcn 安装位置、字体与主题、`AGENTS.md` 托管块。
- `apps/bff/CLAUDE.md`：BFF 边界、ESM 导入后缀、端口 4000。
- `apps/backend/CLAUDE.md`：领域服务边界、ESM 导入后缀、端口 5000。
- `packages/ui/CLAUDE.md`：源码包、`exports`、`@source`、Storybook 与 MCP、组件只能从 app 目录添加。
- `packages/typescript-config/CLAUDE.md`：profile 分工、路径选项不能进共享包、Next 跳过自动写入、`types` 必须留在 app。
- `packages/vitest-config/CLAUDE.md`：profile 与覆盖率门槛、路径项留在各包、`.ts` 源码加载与 Node 26 前提。

每个包同时有 `README.md` 与 `AGENTS.md`；三份文件的分工与章节要求见 [.claude/rules/doc-sync.md](.claude/rules/doc-sync.md)。

## 技术栈与当前实现

- 已实现：`apps/frontend` 的 Next.js 16 + React 19 + Tailwind v4 骨架（3000，`src/`）；`packages/ui` 的 shadcn `radix-nova` 组件与样式；`apps/backend` 与 `apps/bff` 的 NestJS 12 + ESM 骨架（5000 / 4000，只有 `GET /health`）；四个包的 Vitest 配置与 `health` / 页面 / `Button` 冒烟测试，根 `pnpm test` 行覆盖率门槛 95%。
- 桌面端：Electron 壳待接入；Next.js 前端已可独立运行，通过 `@workspace/ui` 引用共享组件。
- 后端：NestJS 本地运行；LangGraph.js 编排 Agent，LangChain.js 接模型，Zod 定义 Case IR 与结构化输出。
- 执行：`ky` 发请求 + Vitest 断言；`chrome-devtools` MCP 只做页面采集，不承担批量接口执行。
- 数据：Supabase（Postgres、pgvector、Auth、Storage）经 MikroORM 访问；GraphRAG 用邻接表 + 递归 CTE 配合 pgvector；OKF 文档放 Storage。
- 协同：A2A 负责任务派发与状态回传；Deep Agents 是可选增强，不进主架构。

## 文档同步

改动影响命令、依赖、工作区结构、架构或文档入口时，必须在同一次改动中更新 `README.md`、`CLAUDE.md`、`AGENTS.md`、`doc/README.md`，以及 `openspec/config.yaml` 的 `context` / `openspec/specs`。完整触发条件与检查清单见 [.claude/rules/doc-sync.md](.claude/rules/doc-sync.md)。

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
