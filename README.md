# LLM-Agent-API-Test-Case-G-enerator

基于大模型智能体的接口测试用例辅助生成系统的设计与实现。

## 项目定位

系统面向「别人交付已做好的功能」这一前提：由 AI 按接口生成用例与测试数据（含爬页面采集），
由 Agent 执行测试，并将现场与正常现场记忆 / GraphRAG / OKF 进行比对；不一致时按记忆重放复现并
出具测试报告，经 A2A 派发；一致则记录带数据的正常现场并沉淀回流。

系统红线：只诊断与复验，不改代码；报告是唯一交付物；AI 干活、人拍板。

> 当前仓库已有四个可运行的应用骨架：`apps/frontend`（Next.js 静态导出前端）、`apps/desktop`（Electron 桌面壳）、`apps/bff` 与 `apps/backend`（NestJS）；共享 UI、tsconfig、Vitest、类型契约与环境变量校验在 `packages/`；业务模块尚未实现。

## 目录结构

```
.
├── doc/                 # 业务架构、技术架构与数据模型图
├── openspec/            # OpenSpec 规格与变更（specs / changes）
├── .agents/skills/      # OpenSpec 与第三方技能；.claude/skills/ 是同步副本
├── apps/                # desktop（Electron）、backend（5000）、bff（4000）、frontend（3000）
├── packages/            # ui：共享组件与样式；typescript-config：共享 tsconfig；vitest-config：共享 Vitest profile；types：跨应用类型契约；config：env 解析与校验
├── .claude/             # 规则、技能与 /opsx 命令
├── .github/             # CI 工作流、复合 action、协作模板
├── .husky/              # pre-commit 与 commit-msg
├── commitlint.config.mjs # 提交信息规则
├── lint-staged.config.mjs # 暂存文件的 oxlint / oxfmt 分派
├── renovate.json        # 依赖升级与 GitHub Actions digest 固定
├── .env.example         # 环境变量声明入口
├── .env.development     # 本地开发 / 测试值（gitignored）
├── .env.production      # 生产构建值（gitignored）
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
- Windows：执行 `git config --global core.longpaths true`，避免深层 `node_modules` 或 git worktree 路径触发 `Filename too long`

依赖版本统一放在 `pnpm-workspace.yaml` 的 `catalogs` 中管理；根 `package.json` 通过 `catalog:tooling` 引用 Turbo、Oxlint 与 Oxfmt。`nodeLinker: hoisted` 是 Electron Forge 8 的硬性要求，不能改回 isolated；Electron 二进制按需下载，无法直连 GitHub Releases 时用 `ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/`。

`pnpm-workspace.yaml` 的 `engineStrict: true` 会让 Node/pnpm 版本不符时直接失败，而不是只发警告。

```bash
pnpm install
pnpm dev                    # 加载 .env → .env.development 后 turbo run dev：并行启动 backend、bff、frontend 与 desktop
pnpm build                  # 加载 .env → .env.production 后 turbo run build：构建四个 app（desktop 复制 renderer）
pnpm check-types            # turbo run check-types：八个包并行类型检查
pnpm test                   # 加载 .env → .env.development 后 turbo run test：六个包并行跑 Vitest，行覆盖率 ≥ 95%
pnpm test:watch             # 加载 .env → .env.development 后 turbo run test:watch：六个包并行 watch
pnpm changeset              # 交互式记录一次版本变更
pnpm changeset:status       # 查看待发布的 changeset
pnpm changeset:version      # 升版本、同步根 package.json、补 CHANGELOG 图标（通常由 CI 调用）
pnpm lint                   # turbo run lint：九个包并行 oxlint
pnpm sherif                 # 依赖版本 / 依赖类型 / workspace 一致性检查
pnpm knip                   # 死依赖、死引用、死文件、死导出检查
pnpm lint:fix               # turbo run lint:fix：自动修复可修复项
pnpm format                 # turbo run format：九个包并行 oxfmt --check
pnpm format:fix             # turbo run format:fix：写入格式化
pnpm format:root            # 根配置文件 oxfmt --check（不属于任何 workspace 包）
pnpm format:root:fix        # 写入根配置文件格式
pnpm --filter frontend dev  # 只启动 Next 前端（3000）
pnpm --filter frontend build
pnpm --filter desktop make  # 生成 Windows x64 ZIP（需先有 apps/frontend/out）
```

`dev` / `test` / `test:watch` 通过 Node 依次加载 `.env` 与 `.env.development`，`build` 加载 `.env` 与 `.env.production`；文件不存在时只打印提示，不影响退出码，后加载的文件覆盖先加载的值。变量必须在 `turbo.json` 的 `env` 中声明，否则 Turbo 的 strict 模式不会把它传给任务。

### 提交前 hook

`pnpm install` 会通过 `prepare` 安装 husky，把 `core.hooksPath` 指向 `.husky/_`：

| hook | 内容 | 作用范围 |
|---|---|---|
| `pre-commit` | `lint-staged` → `oxlint --fix` → `oxfmt` | 只处理暂存文件；根配置、`.github/`、`renovate.json` 也在覆盖内，Markdown 不处理 |
| `commit-msg` | `commitlint --edit` | 校验 `type(scope): subject`，`type` 限 conventional 列表 |

hook 只做本地提前检查，全量 `lint` / `format` / `check-types` / `test` 仍由 CI 的 `quality`、`test` workflow 负责。需要临时跳过时用 `git commit --no-verify`；Windows 上 hook 依赖 Git for Windows 自带的 `sh`（安装 Git 时保留 Git Bash）。

## 服务与前端骨架

| 服务 | 目录 | 端口 | 入口 |
|---|---|---|---|
| backend | `apps/backend` | 5000 | `GET /health` |
| BFF | `apps/bff` | 4000 | `GET /health` |
| 前端 | `apps/frontend` | 3000 | `/`（静态导出） |
| 桌面壳 | `apps/desktop` | 无独立端口 | 开发态加载 3000；生产态 `app://bundle/` |
| Storybook | `packages/ui` | 6006 | `pnpm --filter @workspace/ui storybook` |

两个 Nest 服务都是 NestJS 12 + ESM，依赖统一通过 `catalog:backend` 引用；当前只有健康检查，没有业务模块；测试与 lint / format 已接入，只有一个 `health` 冒烟用例。

前端是 Next.js 16 + React 19 + Tailwind v4，应用代码在 `apps/frontend/src`；shadcn 组件、`cn()` 与全局样式在 `packages/ui`，通过 `@workspace/ui` 引用。前端使用 `output: "export"`，`pnpm --filter frontend build` 产出 `apps/frontend/out/`；`next start` 已移除。新增组件时必须让 CLI 以 app 工作区为目标：

```bash
pnpm dlx shadcn@latest add <component> -c apps/frontend
```

UI 组件会落到 `packages/ui/src/components`，app 级 block 落到 `apps/frontend/src/components`。

桌面壳在 `apps/desktop`，使用 Electron Forge 8 + Electron 45：开发态加载 `http://localhost:3000`，生产态通过 `app://bundle/` 托管 `apps/frontend/out`，不启动 Next 服务。`pnpm build` 先完成前端静态导出，再由 Turbo 的 `desktop#build` 复制到 `apps/desktop/renderer`；`pnpm --filter desktop make` 生成 Windows x64 ZIP。BFF / backend / MCP 的进程托管不在本期范围。

`packages/ui` 的 Storybook 在 6006 提供组件预览与 MCP 端点 `http://127.0.0.1:6006/mcp`；MCP 只在 Storybook dev 运行时可用，当前为 docs + development 工具集。

前端、NestJS 与 UI 包的 TypeScript 配置统一继承 `packages/typescript-config` 的 profile（`nextjs` / `react-library` / `nestjs`；desktop 直接继承 `base` 并改 `moduleResolution: Bundler`），类型检查用 `pnpm check-types`；profile 分工见 [packages/typescript-config/README.md](packages/typescript-config/README.md)。

四个 app 之间不直接 import；跨应用共享的类型契约放在 `packages/types`（`@workspace/types`），只发类型、没有运行时产物，消费方用 `import type`。controller 入参 DTO 与桌面壳主进程内部契约留在各自包内，见 [packages/types/README.md](packages/types/README.md)。

环境变量由 `packages/config`（`@workspace/config`）提供解析与校验：各应用在自己的 `src/config.ts` 定义 schema，启动时非法值直接失败；`.env` 仍由根脚本加载。见 [packages/config/README.md](packages/config/README.md)。

Vitest 配置统一继承 `packages/vitest-config` 的 `base` / `react` profile，测试用 `pnpm test`；测试文件按各栈官方约定放置（Nest 的 `src/**/*.spec.ts`、React 的 `__tests__/**/*.test.{ts,tsx}`），行覆盖率门槛 95%，见 [packages/vitest-config/README.md](packages/vitest-config/README.md)。

覆盖率默认 reporter 是 `text` + `lcov` + `json-summary`，各包 `coverage/` 下会生成 `lcov.info` 与 `coverage-summary.json`；需要可视化 HTML 时用 `pnpm test -- --coverage.reporter=html` 或单包 `vitest run --coverage --coverage.reporter=html`。

Lint 与格式化统一用 Oxc 的 Oxlint / Oxfmt，配置在根目录 `.oxlintrc.json` / `.oxfmtrc.json`；每个 workspace 包提供 `lint` / `format` 脚本，根 `pnpm lint` / `pnpm format` 通过 Turbo 一次跑完九个包。根目录的 `package.json`、`pnpm-workspace.yaml`、`turbo.json`、两个 Oxc 配置、`.mcp.json`、`skills-lock.json`、`.github/`、`renovate.json` 不属于任何 workspace 包，由 `pnpm format:root` / `format:root:fix` 检查；`.nvmrc`、`.env*` 与 `apps/frontend/.env*` 在 Turbo 的 `globalDependencies` 中，`.editorconfig` 只在 `format` 任务的 `inputs` 中。

依赖与死代码检查：`pnpm sherif` 校验依赖版本、依赖类型与 workspace 一致性；`pnpm knip` 检查未使用 / 未声明的依赖、死文件与死导出，配置在 `knip.jsonc`。两者都进入 `quality` workflow；`knip:fix` / `sherif:fix` 会直接改文件与依赖，只在本地人工确认后使用。

## CI 与自动化

[![Quality](https://github.com/HuayanZhong/LLM-Agent-API-Test-Case-G-enerator/actions/workflows/quality.yml/badge.svg)](https://github.com/HuayanZhong/LLM-Agent-API-Test-Case-G-enerator/actions/workflows/quality.yml)
[![Test](https://github.com/HuayanZhong/LLM-Agent-API-Test-Case-G-enerator/actions/workflows/test.yml/badge.svg)](https://github.com/HuayanZhong/LLM-Agent-API-Test-Case-G-enerator/actions/workflows/test.yml)
[![Security](https://github.com/HuayanZhong/LLM-Agent-API-Test-Case-G-enerator/actions/workflows/security.yml/badge.svg)](https://github.com/HuayanZhong/LLM-Agent-API-Test-Case-G-enerator/actions/workflows/security.yml)

工作流按职责拆分；所有 action 按 SHA 固定，`permissions` 默认 `contents: read`，checkout 统一 `persist-credentials: false`。

| 工作流 | 触发 | 内容 |
|---|---|---|
| `quality.yml` | `push: main`、PR、merge queue | `pnpm lint`、`format`、`format:root`、`check-types`、`sherif`、`knip` |
| `test.yml` | 同上 | `pnpm test`，上传各包 `lcov.info` / `coverage-summary.json` |
| `release.yml` | `push: main`（限定路径） | Changesets 开/更新 Version Packages PR；不发布 npm |
| `build.yml` | 同上 | `pnpm build`，上传 `.next` / `dist`，保留 7 天 |
| `security.yml` | `push: main`、PR、每周 | zizmor 扫 workflow；`pnpm audit --audit-level=high` |
| `labeler.yml` | `pull_request_target` | 按 `apps/frontend`、`packages`、`.github`、文档等路径打标签 |

`renovate.json` 周末运行，`minimumReleaseAge: "3 days"`，按 react / nestjs / testing / github-actions 分组，不自动合并，GitHub Actions 自动固定 digest。

不接 AI PR 审查：这类工具只评论、不阻断合并，且 `claude-code-action` 只认官方 key 或 Bedrock / Vertex，第三方中转在 CI 不可用。需要时用仓库 Rulesets 的 Copilot code review。建议先观察一轮，再把 `quality` 与 `test` 设为 required checks；`build`、`security` 先不 required，避免误报阻塞合并。

## 版本与发布

九个 workspace 包通过 Changesets 的 `fixed` 组共用同一个产品版本，配置在 [.changeset/config.json](.changeset/config.json)：

1. 功能 PR 里执行 `pnpm changeset`，提交生成的 `.changeset/*.md`；
2. 合并到 `main` 后，`release` workflow 运行 `pnpm changeset:version`，开或更新 Version Packages PR；
3. 合并 Version Packages PR 后，九个包与根 `package.json` 的版本一起更新，`apps/desktop` 的 Forge 产物名随之变化。

不发布 npm、不打 git tag；根 `package.json` 不在 workspace 内，由 [scripts/sync-version.mjs](scripts/sync-version.mjs) 同步，九包版本不一致时脚本直接失败。

CHANGELOG 由 [.changeset/changelog.mjs](.changeset/changelog.mjs) 生成（摘要 + 一个 PR/提交链接），分节标题的 💥 / ✨ / 🩹 图标由 [scripts/format-changelog.mjs](scripts/format-changelog.mjs) 在升版本后补齐。版本标题必须保持 `## x.y.z` 原样，`changesets/action` 靠它抓 Version Packages PR 正文。

## 包级文档

每个 workspace 包都有一份 `README.md`、`CLAUDE.md`、`AGENTS.md`。包本地事实（命令、端口、边界）以包 README 为准；下面的表格只是聚合入口。

| 包 | 说明 | AI 规则 | 跨工具入口 |
|---|---|---|---|
| `apps/frontend` | [README](apps/frontend/README.md) | [CLAUDE](apps/frontend/CLAUDE.md) | [AGENTS](apps/frontend/AGENTS.md) |
| `apps/desktop` | [README](apps/desktop/README.md) | [CLAUDE](apps/desktop/CLAUDE.md) | [AGENTS](apps/desktop/AGENTS.md) |
| `apps/bff` | [README](apps/bff/README.md) | [CLAUDE](apps/bff/CLAUDE.md) | [AGENTS](apps/bff/AGENTS.md) |
| `apps/backend` | [README](apps/backend/README.md) | [CLAUDE](apps/backend/CLAUDE.md) | [AGENTS](apps/backend/AGENTS.md) |
| `packages/ui` | [README](packages/ui/README.md) | [CLAUDE](packages/ui/CLAUDE.md) | [AGENTS](packages/ui/AGENTS.md) |
| `packages/typescript-config` | [README](packages/typescript-config/README.md) | [CLAUDE](packages/typescript-config/CLAUDE.md) | [AGENTS](packages/typescript-config/AGENTS.md) |
| `packages/vitest-config` | [README](packages/vitest-config/README.md) | [CLAUDE](packages/vitest-config/CLAUDE.md) | [AGENTS](packages/vitest-config/AGENTS.md) |
| `packages/types` | [README](packages/types/README.md) | [CLAUDE](packages/types/CLAUDE.md) | [AGENTS](packages/types/AGENTS.md) |
| `packages/config` | [README](packages/config/README.md) | [CLAUDE](packages/config/CLAUDE.md) | [AGENTS](packages/config/AGENTS.md) |

## 环境变量

根目录 [.env.example](.env.example) 是唯一声明入口；实际值分别放 `.env`、`.env.development`、`.env.production`（均被忽略）。加载顺序是后者覆盖前者：`dev` / `test` / `test:watch` 用 `.env` + `.env.development`，`build` 用 `.env` + `.env.production`。变量还必须写进 `turbo.json` 的任务 `env` 才会传给任务。当前声明 `BACKEND_PORT`（默认 5000）、`BFF_PORT`（默认 4000）、`ELECTRON_RENDERER_URL`（默认 `http://localhost:3000`）与 `NEXT_PUBLIC_BFF_URL`。

前端浏览器可见变量用 `NEXT_PUBLIC_*`，实际值放 `apps/frontend/.env.development` / `.env.production`，由 Next 原生加载；变量名仍在根 `.env.example` 声明。

真实的 `.env`、`.env.local`、`.env.development`、`.env.production` 已被 `.gitignore` 忽略，不要提交密钥。

## OpenSpec 工作流

本项目用 OpenSpec 2.0 做规格驱动开发：规格在 `openspec/specs/`，变更在 `openspec/changes/`，AI 技能在 `.agents/skills/`；`.claude/skills/` 是同步副本，升级 OpenSpec 后需要比对两处内容。

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
