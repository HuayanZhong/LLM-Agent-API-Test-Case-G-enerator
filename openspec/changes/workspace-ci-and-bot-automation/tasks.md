# Tasks

## 1. 复合 setup action

- [ ] 1.1 新增 `.github/actions/setup/action.yml`：`pnpm/action-setup`（12.18.0）+ `actions/setup-node`（`node-version-file: .nvmrc`、`cache: pnpm`）+ `pnpm install --frozen-lockfile`；用 `actionlint` 或 `yamllint` 验证语法，用一次临时 PR 验证安装成功
- [ ] 1.2 所有后续 checkout 统一 `persist-credentials: false`，action 按 SHA 固定；用 `zizmor` 在本地扫 `.github` 验证无 unpinned action

## 2. 基础 CI 工作流

- [ ] 2.1 新增 `.github/workflows/quality.yml`（`push: main`、`pull_request`、`merge_group`，`permissions: contents: read`，concurrency，`timeout-minutes: 10`）：复用 setup 后依次跑 `pnpm lint`、`pnpm format`、`pnpm format:root`、`pnpm check-types`；用 PR 验证四个命令退出 0
- [ ] 2.2 新增 `.github/workflows/test.yml`：跑 `pnpm test`，`if: always()` 上传 `apps/*/coverage` 与 `packages/*/coverage` 的 `lcov.info` / `coverage-summary.json`；用 PR 验证 artifact 可下载，故意让一个测试失败验证 artifact 仍上传（验证后恢复）
- [ ] 2.3 新增 `.github/workflows/build.yml`：复用 setup 后跑 `pnpm build`，上传 `.next` / `dist` artifact（保留 7 天）；用 PR 验证构建成功、artifact 存在

## 3. 安全与依赖自动化

- [ ] 3.1 新增 `.github/workflows/security.yml`：`zizmor` job（`security-events: write`、`actions: read`，checkout `persist-credentials: false`）+ `audit` job（复用 setup 后 `pnpm audit --audit-level=high`），`push: main`、`pull_request`、`schedule` 每周；用 PR 验证两 job 正常运行，本地 `pnpm audit` 结果与 CI 一致
- [ ] 3.2 新增 `renovate.json`：`config:recommended` + `helpers:pinGitHubActionDigests`，周末 schedule，`minimumReleaseAge: "3 days"`，按 react / nestjs / testing / github-actions 分组，不自动合并，lockfile 维护；用 Renovate 的 config validator 或本地 `npx --yes renovate-config-validator` 验证配置合法
- [ ] 3.3 评估 `pnpm audit` 的已知漏洞：如有不可修项，记录到 `pnpm.auditConfig.ignoreCves` 并写复查条件；验证 CI 在该配置下通过

## 4. Agent 审查

- [ ] 4.1 新增 `.github/workflows/agent-review.yml`：`pull_request` opened/synchronize/ready_for_review，跳过 draft 与 fork PR，`pull-requests: write` + `id-token: write`，`timeout-minutes: 15`，concurrency 按 PR 取消；用 `anthropics/claude-code-action` 与 `ANTHROPIC_API_KEY`，prompt 写清项目红线（只诊断不改码、测试报告唯一交付物）与“不报告 linter 已覆盖的问题”；用内部 PR 验证只评论、不 approve
- [ ] 4.2 可选：新增 `.github/copilot-instructions.md`，浓缩项目红线、注释规则、测试约定；验证 GitHub Copilot review 读取该文件

## 5. 协作文件

- [ ] 5.1 新增 `.github/labeler.yml` 与 `.github/workflows/labeler.yml`（`pull-requests: write`），按 `apps/frontend`、`apps/backend`、`apps/bff`、`packages`、`.github`、`documentation` 打标签；用 PR 验证标签自动应用
- [ ] 5.2 新增 `.github/CODEOWNERS`、`.github/pull_request_template.md`、`.github/ISSUE_TEMPLATE/{bug,feature,chore}.md`；用 GitHub 文档中的格式验证 CODEOWNERS 生效

## 6. 文档与验证

- [ ] 6.1 更新根 `README.md`：新增 CI 状态与工作流清单、Renovate 与 agent review 说明、required checks 建议；命令块不变
- [ ] 6.2 更新根 `CLAUDE.md` 与 `AGENTS.md`：`.github` 目录职责、agent review 权限与 secrets、fork PR 行为、`minimumReleaseAge` 与 Renovate 对齐
- [ ] 6.3 更新 `openspec/config.yaml` 的 `context`：补 CI 与自动化现状
- [ ] 6.4 全量验证：`pnpm lint`、`pnpm format`、`pnpm format:root`、`pnpm check-types`、`pnpm test`、`pnpm build` 在本地全部退出 0；PR 上四类工作流全部通过；`openspec validate --all` 通过

## Workflow follow-up

- 计划评审通过后，按 `openspec-apply-change` 实施。
- 实施与验证完成后，按 `openspec-archive-change` 归档到 `openspec/changes/archive/`。
