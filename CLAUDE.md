# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 仓库现状

设计优先的本科毕设项目：基于大模型智能体的接口测试用例辅助生成系统。当前仓库已有 `apps/frontend` 的 Next.js 16 静态导出前端（含 `/login/` 邮箱登录、`/register/` 验证码注册的 UI 演示与根路径跳转）、`apps/desktop` 的 Electron 桌面壳、`packages/ui` 的共享组件包、`packages/types` 的跨应用类型契约、`packages/config` 的环境变量校验、`packages/request` 的 ky 请求基础设施，以及 `apps/backend`、`apps/bff` 两个 NestJS 12 骨架；业务模块尚未实现，测试与 lint / format 已接入。

## 常用命令

在仓库根目录执行：

```bash
pnpm install
pnpm dev          # 加载 .env → .env.development 后 turbo run dev
pnpm build        # 加载 .env → .env.production 后 turbo run build（四个 app，产物进缓存）
pnpm check-types  # 根脚本：turbo run check-types
pnpm test         # 加载 .env → .env.development 后 turbo run test（行覆盖率 < 95% 失败）
pnpm test:watch   # 加载 .env → .env.development 后 turbo run test:watch
pnpm changeset    # 交互式记录一次版本变更
pnpm changeset:status   # 查看待发布的 changeset
pnpm changeset:version  # 升版本、同步根 package.json、补 CHANGELOG 图标（通常由 CI 调用）
pnpm lint         # 根脚本：turbo run lint（十个包并行 oxlint）
pnpm lint:fix     # 根脚本：turbo run lint:fix
pnpm sherif       # 依赖版本 / 依赖类型 / workspace 一致性检查
pnpm knip         # 死依赖、死引用、死文件、死导出检查（配置在 knip.jsonc）
pnpm knip:fix     # 本地人工确认后使用；会直接删依赖与导出
pnpm format       # 根脚本：turbo run format（十个包并行 oxfmt --check）
pnpm format:fix   # 根脚本：turbo run format:fix
pnpm format:root      # 根配置文件 oxfmt --check
pnpm format:root:fix  # 写入根配置文件格式
```

- 工作区命令：`pnpm --filter <workspace-name> <script>`。
- `turbo.json` 与根 `package.json` 暴露 `dev`（`persistent: true`、`cache: false`、`env: ["BACKEND_PORT", "BFF_PORT", "ELECTRON_RENDERER_URL"]`）、`build`（`dependsOn: ["^build"]`，产物 `.next/**`、`dist/**`、`out/**`）、`desktop#build`（`dependsOn: ["frontend#build"]`、产物 `renderer/**`）、`check-types`（`dependsOn: ["^check-types"]`）、`test`（`outputs: ["coverage/**"]`）、`test:watch`（persistent、不缓存）、`lint` / `format` 与其 fix 任务；fix 任务 `cache: false`。`globalDependencies` 只有 `.nvmrc`、`.env*` 与 `apps/frontend/.env*`；Oxlint / Oxfmt / `.editorconfig` 通过 `$TURBO_ROOT$` 进入 `lint` / `format` 的任务 `inputs`，改它们不会误伤 build / test 缓存。根配置文件由 `//#format:root` 根任务单独检查。
- 依赖版本统一放 `pnpm-workspace.yaml` 的 `catalogs`：`tooling`（Turbo、TypeScript、OpenSpec、shadcn、Oxlint、Oxfmt）、`frontend`（Next、React、Tailwind 与 UI 依赖）、`desktop`（Electron、Forge、`@electron/fuses`、Node 24 类型）、`backend`（NestJS）、`shared`（ky 等跨端运行时依赖）。包内用 `catalog:<name>` 引用。
- `pnpm-workspace.yaml` 的 `engineStrict: true` 会让 Node/pnpm 版本不符时直接失败，而不是只发警告；`nodeLinker: hoisted` 是 Electron Forge 8 的硬性要求，pnpm 12 只从该文件读取，不能写回 `.npmrc`。
- 四个 app 都定义了 `dev`；根 `pnpm dev` 通过 Turbo 并行启动 frontend（3000）、bff（`BFF_PORT`，默认 4000）、backend（`BACKEND_PORT`，默认 5000）与 desktop（Electron 加载 3000）。`dev` / `test` / `test:watch` 先用 Node 依次加载 `.env` 与 `.env.development`，`build` 加载 `.env` 与 `.env.production`，再由 Turbo 按 strict 模式把声明的变量传给任务。
- 前端组件安装：在仓库根执行 `pnpm dlx shadcn@latest add <component> -c apps/frontend`；UI 组件写入 `packages/ui`，不要手动放到 `apps/frontend`。
- Storybook：`pnpm --filter @workspace/ui storybook`（6006）；MCP 端点 `http://127.0.0.1:6006/mcp` 仅 dev 运行时可用，当前为 docs + development 工具集。
- 测试框架是 Vitest 5：根 `pnpm test` 经 Turbo 并行跑六个包，行覆盖率门槛 95%（`coverage.thresholds.lines`）。单包 `pnpm --filter <pkg> test`，watch 用 `test:watch`。配置继承 `packages/vitest-config`，测试文件按官方约定：Nest 的 `src/**/*.spec.ts`、React 的 `__tests__/**/*.test.{ts,tsx}`、Electron 的 `__tests__/**/*.test.ts`。覆盖率 reporter 为 `text` + `lcov` + `json-summary`，HTML 按需用 `--coverage.reporter=html`。
- Lint 与格式化是 Oxc：根 `.oxlintrc.json` / `.oxfmtrc.json` 是唯一配置，十个包各提供 `lint` / `format` 脚本，根 `pnpm lint` / `pnpm format` 经 Turbo 一次跑完；单包用 `pnpm --filter <pkg> lint` / `format`。根配置文件由 `pnpm format:root` 检查：`package.json`、`pnpm-workspace.yaml`、`turbo.json`、两个 Oxc 配置、`.mcp.json`、`skills-lock.json`、`.github/`、`renovate.json`、`knip.jsonc`。
- 依赖与死代码：`pnpm sherif` 校验依赖版本、依赖类型与 workspace 协议一致性；`pnpm knip` 检查未使用 / 未声明依赖、死文件与死导出，配置在根 `knip.jsonc`。两者都进 `quality` workflow；`knip:fix` / `sherif:fix` 只在本地人工确认后使用，不要自动运行。CLI-only 依赖（`@fission-ai/openspec`）与技能资产（`.agents/**`）在配置里显式豁免并注明原因。
- 桌面壳：`apps/desktop`（Forge 8 + Electron 45）。`pnpm --filter desktop dev` 加载 3000；`package` / `make` 先生成 `renderer` 再打包；`make` 产出 `out/make/zip/win32/x64/`。Electron 二进制按需下载，网络不可直连 GitHub 时用 `ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/`。

**版本口径**：Node.js >= 26.12.1、pnpm >= 12.18.0，以 `package.json` 的 `engines` 为准（README 已对齐）。

**提交前 hook**：`pnpm install` 经 `prepare` 安装 husky（`core.hooksPath` = `.husky/_`）。`pre-commit` 跑 `lint-staged`，只对暂存文件执行 `oxlint --fix` 与 `oxfmt`，并覆盖根配置、`.github/`、`renovate.json`，不处理 Markdown；`commit-msg` 跑 `commitlint`，校验 conventional 的 `type(scope): subject`，scope 不设白名单。hook 只做本地提前检查：全量 `lint` / `format` / `check-types` / `test` 仍由 CI 的 `quality` 与 `test` workflow 判定。临时跳过用 `git commit --no-verify`。

## 版本管理

- 十个 workspace 包通过 Changesets 的 `fixed` 组共用同一个版本；配置在 `.changeset/config.json`，`privatePackages: { version: true, tag: false }`，不发布 npm、不打 tag。
- 日常流程：功能 PR 里执行 `pnpm changeset` 并提交 `.changeset/*.md`；合并到 `main` 后 `release` workflow 开/更新 Version Packages PR；再合并该 PR 版本才生效。
- 根 `package.json` 不在 workspace 范围内，`pnpm changeset:version` 末尾用 `scripts/sync-version.mjs` 同步；十个包版本不一致时脚本直接失败。
- `apps/desktop` 的版本决定 Electron Forge 的 ZIP / exe 版本，发交付物前确认版本 PR 已合并。
- 不要让开发者手改各包 `version` 或手写 CHANGELOG。CHANGELOG 由 `.changeset/changelog.mjs` 生成：链接解析走 `@changesets/changelog-github`，行格式收敛成「摘要 + 一个 PR/提交引用」；分节标题的图标（💥 / ✨ / 🩹）由 `scripts/format-changelog.mjs` 在 `changeset version` 之后补齐，因为 Changesets 把标题写死在 `apply-release-plan` 里，生成器改不了。
- `changesets/action` 用 `## x.y.z` 精确匹配版本标题来抓 Version Packages PR 正文，不要给版本标题加日期或前缀；分节标题带图标不影响匹配（它只按 `major|minor|patch` 关键字判断级别）。
- 该生成器在 `changeset version` 时调用 GitHub API，必须提供 `GITHUB_TOKEN`：CI 由 `release.yml` 注入；本地执行 `pnpm changeset:version` 前先导出，或写进已被忽略的 `.env`（生成器会读）。缺 token 时版本命令直接失败，不是退化成短哈希。不要关闭 changelog，否则 `changesets/action` 会因找不到文件而失败。

**环境变量**：根目录 `.env.example` 是唯一声明入口，当前声明 `BACKEND_PORT`（默认 5000）、`BFF_PORT`（默认 4000）、`ELECTRON_RENDERER_URL`（默认 `http://localhost:3000`）与 `NEXT_PUBLIC_BFF_URL`。实际值放 `.env`、`.env.development`、`.env.production`（均被忽略），加载顺序为后者覆盖前者：`dev` / `test` / `test:watch` 用 `.env` + `.env.development`，`build` 用 `.env` + `.env.production`。前端 `NEXT_PUBLIC_*` 的实际值放 `apps/frontend/.env.development` / `.env.production`，由 Next 原生加载。新增变量必须同时写进 `turbo.json` 对应任务的 `env`，否则 strict 模式会把它过滤掉。

## OpenSpec 工作流

本项目用 OpenSpec 2.0 做规格驱动开发。新功能或行为变更先提案、再实现、最后归档；`openspec/specs/` 是行为事实来源。

- 技能：`/openspec-explore`、`/openspec-propose <change>`、`/openspec-apply-change`、`/openspec-update-change`、`/openspec-archive-change`、`/openspec-sync-specs`（技能在 `.agents/skills/`，`.claude/skills/` 是同步副本；升级 OpenSpec 后比对两处）。
- 快捷入口：`/opsx <explore|propose|apply|update|sync|archive>`，按第一个参数转发到上述技能。
- CLI：`pnpm exec openspec list`、`show`、`validate --all`、`status`、`archive`。
- 变更目录：`openspec/changes/<change>/`，含 proposal、specs、design、tasks；归档后进入 `changes/archive/`。
- 不要跳过 propose 直接写代码；人工确认计划后再 apply；归档前先 validate。
- `opsx` 是 OpenSpec 1.x 的旧命令前缀；2.0 使用 `/openspec-*`，技能描述里仍接受 “opsx propose” 这类说法。

## AI 协作配置

- `.mcp.json`：项目级 chrome-devtools MCP，固定 `chrome-devtools-mcp@1.13.0`，通过 `pnpm dlx` 启动。Storybook 的 `http://127.0.0.1:6006/mcp` 只在 dev 时可用，不写进常驻配置，需要时在本地 MCP 设置里临时加入。
- `.claude/commands/opsx.md`：`/opsx` 快捷入口。
- `.github/copilot-instructions.md`：Copilot review 的项目红线、注释与测试约定。
- 不配置项目级 `.claude/settings.json`，权限沿用默认模式与全局设置。

## CI 与自动化

- `.github/workflows/` 按职责拆成 `quality`、`test`、`build`、`security`、`labeler`、`release`；安装逻辑统一走 `.github/actions/setup/action.yml`（pnpm 12.18.0 + `.nvmrc` + `--frozen-lockfile`）。
- 所有 action 按 SHA 固定，`permissions` 默认 `contents: read`，checkout 统一 `persist-credentials: false`。
- `release.yml` 只响应 `main` 上限定路径的 push，用 `changesets/action@v2.1.2` 开/更新 Version Packages PR；v2 通过 GitHub API 推送提交，因此 checkout 不需要保留凭据，workflow 单独声明 `contents: write` / `pull-requests: write`。没有 `publish` 步骤，`create-github-releases` 与 `push-git-tags` 都关闭。
- 不接 AI PR 审查。`anthropics/claude-code-action` 只认官方 `ANTHROPIC_API_KEY` 或 Bedrock / Vertex，第三方中转在 CI 里不可用；而这类审查只评论、不阻断合并，单人仓库的维护成本高于收益。需要时用仓库 Rulesets 的 Copilot code review（零 secret、零 workflow），`.github/copilot-instructions.md` 供它和手动审查参考。`labeler.yml` 用 `pull_request_target` 但不 checkout、不执行 PR 代码。
- `renovate.json` 周末运行，`minimumReleaseAge: "3 days"`，按 react / nestjs / testing / github-actions 分组，不自动合并；GitHub Actions digest 由 `helpers:pinGitHubActionDigests` 固定。
- required checks 先只开 `quality` 与 `test`，观察一轮再考虑 `build` / `security`。
- `.github/` 与 `renovate.json` 由 `pnpm format:root` 检查。

## 仓库结构

```text
apps/frontend/   Next.js 16 + React 19 + Tailwind v4 静态导出前端（3000，src/）
apps/desktop/    Electron Forge 8 桌面壳（开发态加载 3000；生产态 app:// 托管静态导出）
apps/bff/        NestJS 12 BFF 骨架（4000，GET /health）
apps/backend/    NestJS 12 本地服务骨架（5000，GET /health）
packages/ui/     共享 shadcn 组件、cn() 与 Tailwind 样式（@workspace/ui）
packages/types/  跨应用只读类型契约（@workspace/types；纯类型、无运行时产物）
packages/config/ 环境变量解析与校验（@workspace/config；运行时工具、无构建）
packages/request/ ky 请求基础设施（@workspace/request；实例工厂 + 浏览器 preset，无构建）
packages/typescript-config/  共享 tsconfig profile（@workspace/typescript-config）
packages/vitest-config/      共享 Vitest profile（@workspace/vitest-config）
.github/         CI 工作流、复合 action、Copilot 指令与协作模板
renovate.json    依赖升级与 GitHub Actions digest 固定
.oxlintrc.json   共享 Oxlint 配置（不用 packages 包化）
.oxfmtrc.json    共享 Oxfmt 配置
doc/             当前设计的事实来源
```

`doc/README.md` 是阅读索引。HTML 是交付物；`doc/source/*.candidate.json` 是可编辑的 Archify 源文件；`doc/_evidence/` 是生成的回执、截图与历史迭代，不作为设计输入，可整体删除。

## 包级文档

进入某个包工作时，先读同目录 `CLAUDE.md`。包级文件只写本地事实（命令、端口、目录、坑），全局规则仍以本文件为准。

- `apps/frontend/CLAUDE.md`：Next App Router、静态导出约束、shadcn 安装位置、字体与主题、`AGENTS.md` 托管块。
- `apps/desktop/CLAUDE.md`：Electron 主进程/preload、`app://` 协议、安全边界、Forge 打包与 pnpm hoisted 约束。
- `apps/bff/CLAUDE.md`：BFF 边界、ESM 导入后缀、`BFF_PORT`（默认 4000）。
- `apps/backend/CLAUDE.md`：领域服务边界、ESM 导入后缀、`BACKEND_PORT`（默认 5000）。
- `packages/ui/CLAUDE.md`：源码包、`exports`、`@source`、Storybook 与 MCP、组件只能从 app 目录添加。
- `packages/types/CLAUDE.md`：共享类型准入边界、只允许 `import type`、controller 入参不进包。
- `packages/config/CLAUDE.md`：env 解析与工厂语义、app schema 留在各自包、包内不写相对 import。
- `packages/request/CLAUDE.md`：单文件自包含、不读环境变量、baseURL 用 ky 的 `prefix` 语义、ky 2 与 1.x 差异注意点。
- `packages/typescript-config/CLAUDE.md`：profile 分工、路径选项不能进共享包、Next 跳过自动写入、`types` 必须留在 app。
- `packages/vitest-config/CLAUDE.md`：profile 与覆盖率门槛、路径项留在各包、`.ts` 源码加载与 Node 26 前提。

每个包同时有 `README.md` 与 `AGENTS.md`；三份文件的分工与章节要求见 [.claude/rules/doc-sync.md](.claude/rules/doc-sync.md)。

## 技术栈与当前实现

- 已实现：`apps/frontend` 的 Next.js 16 + React 19 + Tailwind v4 前端（3000，`output: "export"`；`/` 跳转 `/login/`，`/login/` 与 `/register/` 为邮箱 + 密码 + 验证码的 UI 演示，Toast 反馈，不接 Supabase / 后端）；`apps/desktop` 的 Electron 45 + Forge 8 桌面壳（开发态加载 3000，生产态 `app://` 托管静态导出，Windows x64 ZIP）；`packages/ui` 的 shadcn `radix-nova` 组件与样式；`packages/types` 的跨应用只读类型契约；`packages/config` 的环境变量解析与校验；`packages/request` 的 ky 2 请求基础设施（实例工厂 + 浏览器 preset）；`apps/backend` 与 `apps/bff` 的 NestJS 12 + ESM 骨架（5000 / 4000，只有 `GET /health`）；七个包的 Vitest 配置与 `health` / 页面 / 桌面运行时冒烟测试，根 `pnpm test` 行覆盖率门槛 95%；根 Oxlint / Oxfmt 配置与十个包的 lint / format 脚本。
- 桌面端：Electron 主进程负责窗口、`app://` 协议与安全边界；渲染进程只跑 Next 静态导出。BFF / backend / MCP 的进程托管仍是后续变更。
- 后端：NestJS 本地运行；LangGraph.js 编排 Agent，LangChain.js 接模型，Zod 定义 Case IR 与结构化输出。
- 执行：`ky` 发请求 + Vitest 断言；`chrome-devtools` MCP 只做页面采集，不承担批量接口执行。
- 数据：Supabase（Postgres、pgvector、Auth、Storage）经 MikroORM 访问；GraphRAG 用邻接表 + 递归 CTE 配合 pgvector；OKF 文档放 Storage。
- 协同：A2A 负责任务派发与状态回传；Deep Agents 是可选增强，不进主架构。

## 文档同步

改动影响命令、依赖、工作区结构、架构或文档入口时，必须在同一次改动中更新 `README.md`、`CLAUDE.md`、`AGENTS.md`、`doc/README.md`，以及 `openspec/config.yaml` 的 `context` / `openspec/specs`。完整触发条件与检查清单见 [.claude/rules/doc-sync.md](.claude/rules/doc-sync.md)。

## 代码注释

遵循 [.claude/rules/code-comments.md](.claude/rules/code-comments.md)：只注释关键决策、边界与外部依赖；每条短句，写「为什么」；默认偏多写关键点，但不要复述代码。跨工具入口见 [AGENTS.md](AGENTS.md)。

## JSON Schema 约定

- 远程 schema 只使用官方文档给出的地址，不要自己拼 CDN 路径：
  - `turbo.json`：`https://turborepo.dev/schema.json`
  - `knip.jsonc`：`https://unpkg.com/knip@6/schema-jsonc.json`（官方按主版本提供，`.json` 配置用 `schema.json`）
  - `renovate.json`：`https://docs.renovatebot.com/renovate-schema.json`
  - `components.json`：`https://ui.shadcn.com/schema.json`
- Oxlint 与 Oxfmt 官方文档只提供本地 schema：`.oxlintrc.json` 用 `./node_modules/oxlint/configuration_schema.json`，`.oxfmtrc.json` 用 `./node_modules/oxfmt/configuration_schema.json`，不要改成远程。
- `$schema` 只服务编辑器补全与校验；工具实际读取的仍是本地配置。离线时远程 schema 不加载，但 lint / format / build 不受影响。
- 项目 `.vscode/settings.json` 已信任 `https://turborepo.dev`、`https://unpkg.com`、`https://docs.renovatebot.com`、`https://ui.shadcn.com`；用户全局 `json.schemaDownload.trustedDomains` 另外覆盖 schemastore / raw / jsDelivr，供其他项目使用。新增域名时两处都要补。
- 升级依赖导致 schema 主版本变化时（例如 knip 7），同步修改 URL；Renovate 的升级 PR 要带上这一行。
- `tsconfig.json` 与 Next/Nest 配置通常不需要 `$schema`，不要为了消警告硬加。

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
