# AGENTS.md

本仓库的 AI 协作入口。规则正文不在这里重复，统一指向：

- 项目说明、命令与架构约束：[CLAUDE.md](CLAUDE.md)
- 代码注释规则：[.claude/rules/code-comments.md](.claude/rules/code-comments.md)
- 文档同步规则：[.claude/rules/doc-sync.md](.claude/rules/doc-sync.md)
- OpenSpec 工作流：`openspec/`，技能在 `.agents/skills/openspec-*`；`.claude/skills/` 是同步副本，升级 OpenSpec 后比对两处；命令 `/openspec-propose` 等，快捷入口 `/opsx`
- MCP 配置：`.mcp.json`（chrome-devtools 固定版本；Storybook 端点在 dev 时按需临时加入）
- CI 与自动化：`.github/workflows/` 按职责拆分，共用 `.github/actions/setup`；agent review 只评论不 approve，需 `ANTHROPIC_API_KEY`；`renovate.json` 周末运行、不自动合并；见 [CLAUDE.md](CLAUDE.md)
- 应用骨架：`apps/frontend`（3000，Next.js，`src/`）、`apps/bff`（`BFF_PORT`，默认 4000）、`apps/backend`（`BACKEND_PORT`，默认 5000）；共享 UI 在 `packages/ui`（`@workspace/ui`），共享 tsconfig 在 `packages/typescript-config`，共享 Vitest 配置在 `packages/vitest-config`，见 [CLAUDE.md](CLAUDE.md)
- 环境变量：根 `.env.example` 是唯一声明入口；`dev` / `test` / `test:watch` 经 Node 加载 `.env` + `.env.development`，`build` 加载 `.env` + `.env.production`，前端 `NEXT_PUBLIC_*` 放 `apps/frontend/.env.development` / `.env.production`，变量必须写进 `turbo.json` 对应任务的 `env`，见 [CLAUDE.md](CLAUDE.md)
- 编辑器：`.vscode/extensions.json` 推荐 `oxc.oxc-vscode`，`.vscode/settings.json` 配置默认格式化器与 `ui.shadcn.com` schema 信任域
- 包级入口：`apps/frontend`、`apps/bff`、`apps/backend`、`packages/ui`、`packages/typescript-config`、`packages/vitest-config` 各有一份 `README.md` / `CLAUDE.md` / `AGENTS.md`；进入包内先读该包 `CLAUDE.md`
- Storybook 与 MCP：`packages/ui`（6006），端点为 `http://127.0.0.1:6006/mcp`，仅 dev 时可用；见 [packages/ui/CLAUDE.md](packages/ui/CLAUDE.md)
- 类型检查：`pnpm check-types`（Turbo）；profile 与约束见 [packages/typescript-config/CLAUDE.md](packages/typescript-config/CLAUDE.md)
- 测试：`pnpm test`（Turbo，行覆盖率 ≥ 95%）、`pnpm test:watch`；profile 与测试文件约定见 [packages/vitest-config/CLAUDE.md](packages/vitest-config/CLAUDE.md)
- Lint 与格式化：`pnpm lint` / `pnpm format`（Turbo，六个包并行）；根配置是 `.oxlintrc.json` / `.oxfmtrc.json`，根文件用 `pnpm format:root`（含 `.mcp.json`、`skills-lock.json`、`.github`、`renovate.json`），规则见 [CLAUDE.md](CLAUDE.md)
- 构建：`pnpm build`（Turbo，三个 app）
- 提交前 hook：`pre-commit` 只对暂存文件跑 `oxlint --fix` / `oxfmt`，`commit-msg` 校验 conventional 提交信息；全量检查仍由 CI 负责，跳过用 `git commit --no-verify`，见 [CLAUDE.md](CLAUDE.md)
- 设计文档索引：[doc/README.md](doc/README.md)

修改规则时改上面三处，不要在多份文件里各写一套。
