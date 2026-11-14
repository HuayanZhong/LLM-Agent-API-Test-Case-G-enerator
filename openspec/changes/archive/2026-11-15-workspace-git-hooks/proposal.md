## Why

仓库目前没有任何 git hook：`.git/hooks` 只有样例，`core.hooksPath` 未设置，根 `package.json` 也没有 `prepare`。结果是 lint / format 只能靠自觉，问题要等 PR 上的 `quality` workflow 才暴露；提交信息虽然事实上已是 `feat(ci): ...`、`docs(openspec): ...` 这种形式，但没有任何校验。把这两件事前移到本地提交时，能显著减少往返，也不增加常驻服务。

## What Changes

- `pnpm-workspace.yaml` 的 `tooling` catalog 增加 `husky`、`lint-staged`、`@commitlint/cli`、`@commitlint/config-conventional`；根 `package.json` 用 `catalog:tooling` 引用，并新增 `"prepare": "husky"`。
- 新增 `.husky/pre-commit`：调用 `pnpm exec lint-staged`，只处理暂存文件。
- 新增 `.husky/commit-msg`：调用 `pnpm exec commitlint --edit "$1"`。
- 新增 `lint-staged.config.mjs`：
  - `*.{ts,tsx,js,jsx,mjs,cjs}` → `oxlint --fix`，再 `oxfmt`；
  - `*.{json,jsonc,yaml,yml,css}` → `oxfmt`，覆盖根配置、`.github/**`、`renovate.json` 这些不属于任何 workspace 包的文件；
  - 不含 `*.md`，因为 `.oxfmtrc.json` 已忽略 Markdown。
- 新增 `commitlint.config.mjs`：`extends: ["@commitlint/config-conventional"]`，不设 scope 白名单，`header-max-length: 100`。
- 更新根 `README.md`、`CLAUDE.md`、`AGENTS.md` 与 `openspec/config.yaml` 的 `context`：hook 清单、跳过方式、与 CI 的分工。

**不包含**：不加 `pre-push` 全量 `test` / `check-types`（交给 CI）；不引入 lefthook；不在 hook 里自动 `git add`；不改动任何包的 `lint` / `format` 脚本；不把 hook 纳入 CI 必需检查。

## Capabilities

无 spec 级行为变更，只新增本地开发门禁。`.openspec.yaml` 置 `skip_specs: true`。

## Impact

- 配置：根 `package.json`、`pnpm-workspace.yaml`、`pnpm-lock.yaml`、`.husky/pre-commit`、`.husky/commit-msg`、`lint-staged.config.mjs`、`commitlint.config.mjs`。
- 开发体验：每次提交多一次暂存文件校验；`git commit --no-verify` 可跳过。
- CI：`prepare` 会在 `pnpm install --frozen-lockfile` 时执行；只写入本地 hook，不改变 CI 结果。
- 文档：根 `README.md`、`CLAUDE.md`、`AGENTS.md`、`openspec/config.yaml`。
- 风险：Windows 上 hook 依赖 Git for Windows 的 `sh`；部分暂存时 lint-staged 会 stash 未暂存改动；首次安装需联网拉取三个新依赖。
