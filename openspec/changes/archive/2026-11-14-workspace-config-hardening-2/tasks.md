# Tasks

## 1. 环境变量加载与端口

- [x] 1.1 根 `package.json` 的 `dev`、`build`、`test`、`test:watch` 改为 `node --env-file-if-exists=.env node_modules/turbo/bin/turbo run <task>`；验证无 `.env` 时 `pnpm build` 退出 0 且只输出 `.env not found. Continuing without it.`
- [x] 1.2 `apps/backend/src/main.ts` 改读 `BACKEND_PORT ?? 5000`，`apps/bff/src/main.ts` 改读 `BFF_PORT ?? 4000`；在 `.env.example` 用注释列出两个变量；验证全仓无残留的 `process.env.PORT`，并用 `BACKEND_PORT=5100 BFF_PORT=4100 pnpm dev` 分别请求两个 `/health`
- [x] 1.3 `turbo.json` 的 `dev` 任务声明 `env: ["BACKEND_PORT", "BFF_PORT"]`，`globalDependencies` 改为 `[".nvmrc", ".env*"]`；验证 `turbo run dev --dry=json` 显示两个变量，且临时创建/修改 `.env` 后 `turbo run build --dry=json` 的 hash 变化
- [x] 1.4 更新根 `README.md` / `CLAUDE.md` 的环境变量与启动脚本说明，以及 `apps/backend`、`apps/bff` 的 `README.md` / `CLAUDE.md` 端口变量；验证文档中的端口名、脚本命令与实际 `package.json` / `main.ts` 一致
- [x] 1.5 根脚本改为 `dev` / `test` / `test:watch` 加载 `.env` + `.env.development`、`build` 加载 `.env` + `.env.production`；新增两个环境文件并写入默认端口；验证两个文件被 gitignore、`.env.development` 的覆盖值能到达两个 `/health`、无环境文件时 `pnpm build` 仍退出 0
- [x] 1.6 新增 `apps/frontend/.env.development` / `.env.production`（`NEXT_PUBLIC_BFF_URL`），并把 `apps/frontend/.env*` 加入 Turbo `globalDependencies`；验证文件被 gitignore、`pnpm --filter frontend build` 退出 0、修改前端 env 后 Turbo hash 变化

## 2. Turbo 缓存键与根格式化

- [x] 2.1 从 `globalDependencies` 移除 `.oxlintrc.json`、`.oxfmtrc.json`、`.editorconfig`，给 `lint` / `lint:fix` / `format` / `format:fix` 增加 `$TURBO_ROOT$` 输入；验证改 `.oxlintrc.json` 后 `pnpm build` 仍全命中、`pnpm lint` 缓存失效，改 `.oxfmtrc.json` 后 `pnpm build` 仍命中、`pnpm format` 失效
- [x] 2.2 给 `//#format:root` 声明精确 `inputs`（`package.json`、`pnpm-workspace.yaml`、`turbo.json`、`.oxlintrc.json`、`.oxfmtrc.json`、`.mcp.json`、`skills-lock.json`）；验证修改任意文档后 `pnpm format:root` 命中，修改上述任一配置文件后失效
- [x] 2.3 `format:root` / `format:root:fix` 的文件清单加入 `.mcp.json`、`skills-lock.json`，并同步 README / CLAUDE 的说明；验证临时给 `.mcp.json` 加空格后 `pnpm format:root` 报错、`format:root:fix` 修复后通过
- [x] 2.4 `turbo.json` 的 `build.outputs` 移除 `storybook-static/**`；验证 `turbo run build --dry=json` 不再声明该输出，`pnpm --filter @workspace/ui build-storybook` 仍可执行

## 3. 元数据与依赖

- [x] 3.1 根 `package.json` 版本改为 `0.0.0`；验证 `node -p` 读取根与六个 workspace 包的版本全部为 `0.0.0`
- [x] 3.2 确认 `shadcn` 是 `globals.css` 的构建期依赖并保留：删除后 `pnpm --filter frontend build` 报 `Can't resolve 'shadcn/tailwind.css'`，恢复依赖后构建与 UI 测试通过；记录 `cn@0.2.6` / `cn@0.5.2` 并存为已知现状，不做 override

## 4. skill 目录与编辑器配置

- [x] 4.1 把 `.claude/skills` 下 6 个 `openspec-*` 符号链接替换为与 `.agents/skills` 内容相同的普通文件；验证 `git ls-files -s .claude/skills` 全部为 `100644`，`diff -r .agents/skills .claude/skills` 除 `.openspec-target` 外无差异
- [x] 4.2 更新 `README.md` / `CLAUDE.md` 的 skill 说明为“同步副本”，写明 OpenSpec 升级后需要人工比对；验证文档中不再出现“`.claude/skills` 下是链接”
- [x] 4.3 `.gitignore` 改为 `.vscode/*` 加两个例外，新增 `.vscode/extensions.json`（推荐 `oxc.oxc-vscode`）与 `.vscode/settings.json`（`oxc` 格式化、`formatOnSave`、`files.eol`、`ui.shadcn.com` schema 信任域）；验证两个 JSON 可解析、`git check-ignore -v .vscode/extensions.json` 返回非忽略
- [x] 4.4 根 `README.md` 的开发环境增加 `git config --global core.longpaths true` 与用途说明；验证 README 中命令可复制执行，且与本次 worktree 长路径故障的描述一致

## 5. TypeScript 严格度

- [x] 5.1 `packages/typescript-config/base.json` 增加 `noFallthroughCasesInSwitch` 与 `noImplicitOverride`；验证 `pnpm check-types` 五个包全部通过，若报错则修代码而不是关闭开关

## 6. 文档与上下文同步

- [x] 6.1 更新 `openspec/config.yaml` 的 `context`：根 `.env` 经 Node `--env-file-if-exists` 注入、`BACKEND_PORT` / `BFF_PORT`、Turbo strict 声明规则；验证 `pnpm exec openspec validate --all` 通过，且 context 描述与实际脚本一致
- [x] 6.2 更新根 `AGENTS.md` 的入口索引（环境变量、`.vscode`、skill 副本），确认不复制正文；验证其中相对链接可达、命令与 root `README.md` 不冲突
- [x] 6.3 复现并记录 `pnpm ignored-builds` 在根目录与 `apps/backend` 的 `Cannot identify as no node_modules found`：检查 `node_modules/.modules.yaml` 的 `allowBuilds` / `pendingBuilds`，在干净克隆或 CI 上对比；把结论写入本变更目录的 design「Open Questions」或新增简短记录，验证记录中包含复现环境、命令输出与是否修改 `allowBuilds` 的结论

## 7. 集成验证

- [x] 7.1 运行 `pnpm lint`、`pnpm format`、`pnpm format:root`、`pnpm check-types`、`pnpm test`、`pnpm build`，全部退出 0；确认第二次运行命中 Turbo 缓存
- [x] 7.2 跨任务验证：无 `.env` 时全量命令可运行；`BACKEND_PORT` / `BFF_PORT` 覆盖端口后两个 `/health` 各就各位；修改 lint 配置不影响 build 缓存、修改文档不影响 `format:root` 缓存；把结果记录在变更完成说明中

## Workflow follow-up

- 计划评审通过后，按 `openspec-apply-change` 实施。
- 实施与验证完成后，按 `openspec-archive-change` 归档到 `openspec/changes/archive/`。
- CI 变更（`workspace-ci-and-bot-automation`）落地时，把 `.github/**/*.yml` 与 `renovate.json` 加入 `format:root` 清单。
