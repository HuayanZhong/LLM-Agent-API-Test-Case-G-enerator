# LLM-Agent-API-Test-Case-G-enerator

基于大模型智能体的接口测试用例辅助生成系统的设计与实现。

## 项目定位

系统面向「别人交付已做好的功能」这一前提：由 AI 按接口生成用例与测试数据（含爬页面采集），
由 Agent 执行测试，并将现场与正常现场记忆 / GraphRAG / OKF 进行比对；不一致时按记忆重放复现并
出具测试报告，经 A2A 派发；一致则记录带数据的正常现场并沉淀回流。

系统红线：只诊断与复验，不改代码；报告是唯一交付物；AI 干活、人拍板。

> 当前仓库已有三个可运行的骨架：`apps/frontend`（Next.js）、`apps/bff` 与 `apps/backend`（NestJS）；业务模块尚未实现。

## 目录结构

```
.
├── doc/                 # 业务架构、技术架构与数据模型图
├── openspec/            # OpenSpec 规格与变更（specs / changes）
├── .agents/skills/      # OpenSpec 技能；.claude/skills/ 下是链接
├── apps/                # backend（5000）、bff（4000）、frontend（3000）
├── packages/            # ui：共享 shadcn 组件、cn() 与 Tailwind 样式
├── .claude/             # 规则、技能与 /opsx 命令
├── .env.example         # 环境变量统一声明入口（技术选型确认前保持为空）
├── .mcp.json            # chrome-devtools MCP（固定版本）
├── package.json
├── pnpm-workspace.yaml  # workspace、catalog、engineStrict
├── turbo.json           # Turbo 任务配置（当前只注册 dev）
└── LICENSE              # MIT
```

## 开发环境

- Node.js >= 26.12.1
- pnpm >= 12.18.0（仓库锁定 `pnpm@12.18.0`，见 `packageManager`）

依赖版本统一放在 `pnpm-workspace.yaml` 的 `catalogs` 中管理；根 `package.json` 通过 `catalog:tooling` 引用 Turbo。

`pnpm-workspace.yaml` 的 `engineStrict: true` 会让 Node/pnpm 版本不符时直接失败，而不是只发警告。

```bash
pnpm install
pnpm dev                    # turbo run dev：并行启动 backend、bff 与 frontend
pnpm --filter frontend dev  # 只启动 Next 前端（3000）
pnpm --filter frontend build
```

## 服务与前端骨架

| 服务 | 目录 | 端口 | 入口 |
|---|---|---|---|
| backend | `apps/backend` | 5000 | `GET /health` |
| BFF | `apps/bff` | 4000 | `GET /health` |
| 前端 | `apps/frontend` | 3000 | `/` |

两个 Nest 服务都是 NestJS 12 + ESM，依赖统一通过 `catalog:backend` 引用；当前只有健康检查，没有业务模块、测试或 lint。

前端是 Next.js 16 + React 19 + Tailwind v4，应用代码在 `apps/frontend/src`；shadcn 组件、`cn()` 与全局样式在 `packages/ui`，通过 `@workspace/ui` 引用。新增组件必须在 app 目录执行：

```bash
pnpm dlx shadcn@latest add <component> -c apps/frontend
```

UI 组件会落到 `packages/ui/src/components`，app 级 block 落到 `apps/frontend/src/components`。

## 环境变量

根目录 [.env.example](.env.example) 是唯一声明入口，当前保持为空；等前端/后端框架、数据库和模型网关确认后再补变量。

真实的 `.env`、`.env.local`、`.env.*` 已被 `.gitignore` 忽略，不要提交密钥。

## OpenSpec 工作流

本项目用 OpenSpec 2.0 做规格驱动开发：规格在 `openspec/specs/`，变更在 `openspec/changes/`，AI 技能在 `.agents/skills/`（`.claude/skills/` 下是链接）。

```bash
pnpm exec openspec list          # 查看变更与规格
pnpm exec openspec validate --all
```

在 Claude Code 中：

- `/openspec-explore`：先探索、澄清需求，不写代码。
- `/openspec-propose <变更名>`：生成 proposal、specs、design、tasks。
- `/openspec-apply-change`：按 tasks 实施。
- `/openspec-update-change`：修订计划并保持各产物一致。
- `/openspec-archive-change`：归档并把 delta specs 合并进主规格。
- `/openspec-sync-specs`：只同步规格，不归档。
- `/opsx <explore|propose|apply|update|sync|archive>`：上述技能的快捷入口。

项目级 MCP 配置在 [.mcp.json](.mcp.json)，当前只含 chrome-devtools，通过 `pnpm dlx` 固定版本。

规则：新功能或行为变更先提案再实现；`openspec/specs` 是行为事实来源；归档前跑 `validate`。`opsx` 是 OpenSpec 1.x 的旧命令前缀，2.0 使用 `/openspec-*`，技能描述里仍接受 “opsx propose” 这类说法。

## 文档维护

改动命令、依赖、工作区结构或架构时，同步更新 `README.md`、`CLAUDE.md`、`AGENTS.md`、`doc/README.md`，以及 OpenSpec 的 `context` / `specs`；完整规则见 [.claude/rules/doc-sync.md](.claude/rules/doc-sync.md)。

## 许可证

[MIT](LICENSE)
