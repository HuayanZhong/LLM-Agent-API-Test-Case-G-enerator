# LLM-Agent-API-Test-Case-G-enerator

基于大模型智能体的接口测试用例辅助生成系统的设计与实现。

## 项目定位

系统面向「别人交付已做好的功能」这一前提：由 AI 按接口生成用例与测试数据（含爬页面采集），
由 Agent 执行测试，并将现场与正常现场记忆 / GraphRAG / OKF 进行比对；不一致时按记忆重放复现并
出具测试报告，经 A2A 派发；一致则记录带数据的正常现场并沉淀回流。

系统红线：只诊断与复验，不改代码；报告是唯一交付物；AI 干活、人拍板。

> 当前仓库已有三个可运行的骨架：`apps/frontend`（Next.js）、`apps/bff` 与 `apps/backend`（NestJS）；共享 UI、tsconfig、Vitest 与 Oxc 配置在 `packages/`；业务模块尚未实现。

## 目录结构

```
.
├── doc/                 # 业务架构、技术架构与数据模型图
├── openspec/            # OpenSpec 规格与变更（specs / changes）
├── .agents/skills/      # OpenSpec 技能；.claude/skills/ 下是链接
├── apps/                # backend（5000）、bff（4000）、frontend（3000）
├── packages/            # ui：共享组件与样式；typescript-config：共享 tsconfig；vitest-config：共享 Vitest profile
├── .claude/             # 规则、技能与 /opsx 命令
├── .env.example         # 环境变量统一声明入口（技术选型确认前保持为空）
├── .gitattributes       # 行尾与二进制文件约定
├── .nvmrc               # Node 版本（26.12.1），本地与 CI 共用
├── .editorconfig        # 编辑器缩进与行尾；Oxfmt 会读取
├── .mcp.json            # chrome-devtools MCP（固定版本）
├── .oxfmtrc.json        # 共享 Oxfmt 格式化配置
├── .oxlintrc.json       # 共享 Oxlint 检查配置
├── package.json
├── pnpm-workspace.yaml  # workspace、catalog、engineStrict
├── skills-lock.json     # 第三方 skill 的版本与哈希
├── turbo.json           # Turbo 任务配置（dev / build / check-types / test / lint / format）
└── LICENSE              # MIT
```

## 开发环境

- Node.js >= 26.12.1
- pnpm >= 12.18.0（仓库锁定 `pnpm@12.18.0`，见 `packageManager`）

依赖版本统一放在 `pnpm-workspace.yaml` 的 `catalogs` 中管理；根 `package.json` 通过 `catalog:tooling` 引用 Turbo、Oxlint 与 Oxfmt。

`pnpm-workspace.yaml` 的 `engineStrict: true` 会让 Node/pnpm 版本不符时直接失败，而不是只发警告。

```bash
pnpm install
pnpm dev                    # turbo run dev：并行启动 backend、bff 与 frontend
pnpm build                  # turbo run build：构建三个 app，产物进 Turbo 缓存
pnpm check-types            # turbo run check-types：五个包并行类型检查
pnpm test                   # turbo run test：四个包并行跑 Vitest，行覆盖率 ≥ 95%
pnpm test:watch             # turbo run test:watch：四个包并行 watch
pnpm lint                   # turbo run lint：六个包并行 oxlint
pnpm lint:fix               # turbo run lint:fix：自动修复可修复项
pnpm format                 # turbo run format：六个包并行 oxfmt --check
pnpm format:fix             # turbo run format:fix：写入格式化
pnpm format:root            # 根配置文件 oxfmt --check（不属于任何 workspace 包）
pnpm format:root:fix        # 写入根配置文件格式
pnpm --filter frontend dev  # 只启动 Next 前端（3000）
pnpm --filter frontend build
```

## 服务与前端骨架

| 服务 | 目录 | 端口 | 入口 |
|---|---|---|---|
| backend | `apps/backend` | 5000 | `GET /health` |
| BFF | `apps/bff` | 4000 | `GET /health` |
| 前端 | `apps/frontend` | 3000 | `/` |
| Storybook | `packages/ui` | 6006 | `pnpm --filter @workspace/ui storybook` |

两个 Nest 服务都是 NestJS 12 + ESM，依赖统一通过 `catalog:backend` 引用；当前只有健康检查，没有业务模块；测试与 lint / format 已接入，只有一个 `health` 冒烟用例。

前端是 Next.js 16 + React 19 + Tailwind v4，应用代码在 `apps/frontend/src`；shadcn 组件、`cn()` 与全局样式在 `packages/ui`，通过 `@workspace/ui` 引用。新增组件时必须让 CLI 以 app 工作区为目标：

```bash
pnpm dlx shadcn@latest add <component> -c apps/frontend
```

UI 组件会落到 `packages/ui/src/components`，app 级 block 落到 `apps/frontend/src/components`。

`packages/ui` 的 Storybook 在 6006 提供组件预览与 MCP 端点 `http://127.0.0.1:6006/mcp`；MCP 只在 Storybook dev 运行时可用，当前为 docs + development 工具集。

四个包的 TypeScript 配置统一继承 `packages/typescript-config` 的 profile（`nextjs` / `react-library` / `nestjs`），类型检查用 `pnpm check-types`；profile 分工见 [packages/typescript-config/README.md](packages/typescript-config/README.md)。

Vitest 配置统一继承 `packages/vitest-config` 的 `base` / `react` profile，测试用 `pnpm test`；测试文件按各栈官方约定放置（Nest 的 `src/**/*.spec.ts`、React 的 `__tests__/**/*.test.{ts,tsx}`），行覆盖率门槛 95%，见 [packages/vitest-config/README.md](packages/vitest-config/README.md)。

覆盖率默认 reporter 是 `text` + `lcov` + `json-summary`，各包 `coverage/` 下会生成 `lcov.info` 与 `coverage-summary.json`；需要可视化 HTML 时用 `pnpm test -- --coverage.reporter=html` 或单包 `vitest run --coverage --coverage.reporter=html`。

Lint 与格式化统一用 Oxc 的 Oxlint / Oxfmt，配置在根目录 `.oxlintrc.json` / `.oxfmtrc.json`；每个 workspace 包提供 `lint` / `format` 脚本，根 `pnpm lint` / `pnpm format` 通过 Turbo 一次跑完六个包。根目录的 `package.json`、`pnpm-workspace.yaml`、`turbo.json` 等不属于任何 workspace 包，由 `pnpm format:root` / `format:root:fix` 单独检查；`.editorconfig` 与 `.nvmrc` 已纳入 Turbo `globalDependencies`，改动会失效格式化缓存。

## 包级文档

每个 workspace 包都有一份 `README.md`、`CLAUDE.md`、`AGENTS.md`。包本地事实（命令、端口、边界）以包 README 为准；下面的表格只是聚合入口。

| 包 | 说明 | AI 规则 | 跨工具入口 |
|---|---|---|---|
| `apps/frontend` | [README](apps/frontend/README.md) | [CLAUDE](apps/frontend/CLAUDE.md) | [AGENTS](apps/frontend/AGENTS.md) |
| `apps/bff` | [README](apps/bff/README.md) | [CLAUDE](apps/bff/CLAUDE.md) | [AGENTS](apps/bff/AGENTS.md) |
| `apps/backend` | [README](apps/backend/README.md) | [CLAUDE](apps/backend/CLAUDE.md) | [AGENTS](apps/backend/AGENTS.md) |
| `packages/ui` | [README](packages/ui/README.md) | [CLAUDE](packages/ui/CLAUDE.md) | [AGENTS](packages/ui/AGENTS.md) |
| `packages/typescript-config` | [README](packages/typescript-config/README.md) | [CLAUDE](packages/typescript-config/CLAUDE.md) | [AGENTS](packages/typescript-config/AGENTS.md) |
| `packages/vitest-config` | [README](packages/vitest-config/README.md) | [CLAUDE](packages/vitest-config/CLAUDE.md) | [AGENTS](packages/vitest-config/AGENTS.md) |

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

项目级 MCP 配置在 [.mcp.json](.mcp.json)，当前只含 chrome-devtools，通过 `pnpm dlx` 固定版本。Storybook 的 `http://127.0.0.1:6006/mcp` 只在 dev 运行时可用，因此不写进常驻配置；需要时在本地 MCP 设置里临时加入。

规则：新功能或行为变更先提案再实现；`openspec/specs` 是行为事实来源；归档前跑 `validate`。`opsx` 是 OpenSpec 1.x 的旧命令前缀，2.0 使用 `/openspec-*`，技能描述里仍接受 “opsx propose” 这类说法。

## 文档维护

改动命令、依赖、工作区结构或架构时，同步更新 `README.md`、`CLAUDE.md`、`AGENTS.md`、`doc/README.md`，以及 OpenSpec 的 `context` / `specs`；完整规则见 [.claude/rules/doc-sync.md](.claude/rules/doc-sync.md)。

## 许可证

[MIT](LICENSE)
