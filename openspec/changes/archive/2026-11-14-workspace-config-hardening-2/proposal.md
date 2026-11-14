## Why

第一轮加固解决了 CI 前置的三个缺口，但配置审查又发现一批会随业务代码接入而放大的问题：Turbo 默认 strict 模式却没有任何 `env` 声明，`PORT` 会被过滤且 backend / bff 共用同名变量；`.env` 不参与任务 hash；Oxc 配置放在 `globalDependencies` 会让 lint 改动误伤 build / test 缓存；根 `format:root` 漏掉 `.mcp.json` 与 `skills-lock.json`；元数据、TypeScript 严格度与编辑器配置仍有不一致。趁业务模块尚未开始，先把这些基础语义固定下来，避免以后在错误的缓存与环境假设上继续开发。

## What Changes

- **环境变量加载**：根脚本 `dev`、`test`、`test:watch` 用 Node 26 内置的 `--env-file-if-exists` 依次加载 `.env` 与 `.env.development`，`build` 加载 `.env` 与 `.env.production`，再包装 Turbo；根 `.env.example` 仍是唯一声明入口，实际值放三个被忽略的 env 文件，不新增 dotenv 依赖。前端 `NEXT_PUBLIC_*` 的实际值放 `apps/frontend/.env.development` / `.env.production`，由 Next 原生加载。
- **端口变量拆分**：`apps/backend` 改读 `BACKEND_PORT`（默认 5000），`apps/bff` 改读 `BFF_PORT`（默认 4000），消除 `pnpm dev` 同时启动时共用 `PORT` 的冲突；`.env.example` 注明两个变量。
- **Turbo 环境变量语义**：`turbo.json` 的 `dev` 任务声明 `env: ["BACKEND_PORT", "BFF_PORT"]`；`globalDependencies` 增加 `.env*`，让 `.env` 变更失效缓存；移除 `envMode` 的隐式依赖，保持默认 strict。
- **缓存键收窄**：把 `.oxlintrc.json`、`.oxfmtrc.json`、`.editorconfig` 从 `globalDependencies` 移到 `lint` / `format` 的 `inputs`（用 `$TURBO_ROOT$`）；给 `//#format:root` 声明精确 `inputs`，只覆盖它真正检查的根文件。
- **根文件格式化**：`format:root` / `format:root:fix` 的文件清单补上 `.mcp.json`、`skills-lock.json`。
- **清理失效产物声明**：`build.outputs` 移除 `storybook-static/**`，当前没有任务会构建它；Storybook 仍用包内 `build-storybook`。
- **元数据**：根 `package.json` 版本统一为 `0.0.0`；`@types/node` 26.6.6 已是 26.x 最新，不调整。`shadcn` 保留：`packages/ui/src/styles/globals.css` 通过 `@import "shadcn/tailwind.css"` 在构建期引用它，删除会导致前端构建失败；重复的 `cn@0.2.6` 作为已知现状接受。
- **skill 目录跨平台**：把 `.claude/skills` 下 6 个符号链接还原为与 `.agents/skills` 内容一致的普通文件，统一 git 模式；README / CLAUDE 的“链接”说法改为“同步副本”。
- **TypeScript 严格度**：共享 `base.json` 增加 `noFallthroughCasesInSwitch` 与 `noImplicitOverride`。
- **编辑器配置**：`.gitignore` 只忽略 `.vscode` 的用户私有文件，新增并跟踪 `.vscode/extensions.json`（推荐 `oxc.oxc-vscode`）与 `.vscode/settings.json`（默认格式化器、保存时格式化、`ui.shadcn.com` schema 信任域、LF）。
- **Windows 前置条件**：README 增加 `git config --global core.longpaths true`，说明长路径与 worktree 删除失败的关系。
- **待查项**：复现 `pnpm ignored-builds` 在 Windows 非 ASCII 路径下报 “no node_modules found” 的现象，记录结论与是否需要 `approve-builds` 兜底。

**不包含**：不新增或修改 `.github/`、Renovate、agent review（仍由 `workspace-ci-and-bot-automation` 负责）；不改 GitHub 仓库名与包名（远程仓库本身使用 `G-enerator`）；不调整覆盖率门槛、`passWithNoTests` 与 per-file 阈值；不改变量清单之外的真实密钥；不接入 Nest `ConfigModule`、CORS、ValidationPipe 等业务配置；不处理 `doc/_evidence` 入库策略；不统一 app 包名为 scoped 名称。

## Capabilities

无 spec 级行为变更，只调整工具链、环境变量命名与仓库元数据。`.openspec.yaml` 已置 `skip_specs: true`。

## Impact

- 配置：`turbo.json`、根 `package.json`、`.env.example`、`.gitignore`、`.vscode/extensions.json`、`.vscode/settings.json`、`packages/typescript-config/base.json`。
- 环境文件（gitignored）：根 `.env.development` / `.env.production`、`apps/frontend/.env.development` / `.env.production`。
- 入口：`apps/backend/src/main.ts`、`apps/bff/src/main.ts` 的端口变量；根命令 `dev` / `build` / `test` / `test:watch` 的启动方式。
- skill：`.claude/skills/openspec-*` 由链接转为普通文件；`.agents/skills` 不变。
- 文档：根 `README.md`、`CLAUDE.md`、`AGENTS.md`、`apps/backend` 与 `apps/bff` 的 README / CLAUDE、`openspec/config.yaml` 的 context。
- 风险：环境变量加载方式改变所有本地 Turbo 命令的启动路径；Turbo `inputs` / `globalDependencies` 调整会改变缓存键，需要验证一次冷/热缓存行为；TypeScript 新增两项开关可能暴露现有代码问题；`.vscode` 从完全忽略改为部分跟踪，需要确认不会带出个人设置。
