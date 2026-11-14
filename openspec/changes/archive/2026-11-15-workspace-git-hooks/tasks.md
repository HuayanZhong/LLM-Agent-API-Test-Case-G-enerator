# Tasks

## 1. 依赖与初始化

- [x] 1.1 `pnpm-workspace.yaml` 的 `tooling` catalog 增加 `husky ^9.1.7`、`lint-staged ^17.6.0`、`@commitlint/cli ^21.2.4`、`@commitlint/config-conventional ^21.2.4`；根 `package.json` 用 `catalog:tooling` 引入并加 `"prepare": "husky"`；验证 `pnpm install` 退出 0、`pnpm why husky` 指向根包
- [x] 1.2 创建 `.husky/pre-commit`（`pnpm exec lint-staged`）与 `.husky/commit-msg`（`pnpm exec commitlint --edit "$1"`），保留可执行位；验证 `sh -n .husky/pre-commit .husky/commit-msg` 通过，且 `git config core.hooksPath` 指向 `.husky/_`

## 2. pre-commit 与 lint-staged

- [x] 2.1 新增 `lint-staged.config.mjs`：`*.{ts,tsx,js,jsx,mjs,cjs}` 跑 `oxlint --fix` 再 `oxfmt`；`*.{json,jsonc,yaml,yml,css}` 跑 `oxfmt`；验证暂存一个格式错误的 `.ts` 文件并提交后，提交内容已被格式化，且未暂存的同文件改动没有被带入
- [x] 2.2 验证根文件覆盖：暂存 `renovate.json` 与 `.github/workflows/quality.yml` 的临时格式改动，确认 `oxfmt` 修复后提交成功；验证暂存的 `*.md` 不被处理
- [x] 2.3 验证 lint 失败会阻断提交：用一个触发 correctness 规则的临时 `.ts` 文件提交，确认被拒绝并输出规则名；删除临时文件后确认可正常提交

## 3. commit-msg 与 commitlint

- [x] 3.1 新增 `commitlint.config.mjs`：`extends: ["@commitlint/config-conventional"]`，`header-max-length: 100`，关闭 `body-max-line-length` 与 `footer-max-line-length`；验证 `feat(ci): 新增工作流` 通过，`update stuff` 与 `Feat(ci): x` 被拒绝
- [x] 3.2 验证 `git commit --no-verify` 可跳过两个 hook，且 README 的记录与此一致

## 4. 文档与上下文

- [x] 4.1 根 `README.md` 的开发环境补“提交前 hook”：列出 `pre-commit` / `commit-msg`、只处理暂存文件、`--no-verify` 逃生口、Windows 需要 Git Bash；验证命令可复制执行
- [x] 4.2 根 `CLAUDE.md` 与 `AGENTS.md` 补 hook 说明与“hook 只查暂存、CI 跑全量”的分工；验证相对链接可达、不与 README 冲突
- [x] 4.3 更新 `openspec/config.yaml` 的 `context`：补 husky + lint-staged + commitlint 现状；验证 `pnpm exec openspec validate --all` 通过

## 5. 集成验证

- [x] 5.1 运行 `pnpm lint`、`pnpm format`、`pnpm format:root`、`pnpm check-types`、`pnpm test`，全部退出 0
- [x] 5.2 验证 CI 路径：`CI=true pnpm install --frozen-lockfile` 退出 0，且 `pnpm lint` 在无 hook 参与时仍通过；确认 `prepare` 没有改变 CI 判定

## Workflow follow-up

- 计划评审通过后，按 `openspec-apply-change` 实施。
- 实施与验证完成后，按 `openspec-archive-change` 归档到 `openspec/changes/archive/`。
- 两周后复查 commitlint 的 scope 与正文行长设置，视实际摩擦决定是否收紧。
