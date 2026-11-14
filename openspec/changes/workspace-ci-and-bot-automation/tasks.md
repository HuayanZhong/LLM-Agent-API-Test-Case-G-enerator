# Tasks

## 1. 复合 setup action

- [x] 1.1 新增 `.github/actions/setup/action.yml`：`pnpm/action-setup`（12.18.0）+ `actions/setup-node`（`node-version-file: .nvmrc`、`cache: pnpm`）+ `pnpm install --frozen-lockfile`；用 `@action-validator/cli` 与 PyYAML 验证语法
- [x] 1.2 所有后续 checkout 统一 `persist-credentials: false`，action 按 SHA 固定；静态检查确认所有 `uses`（本地 composite action 除外）均为 40 位 SHA；本地 zizmor 受 Rust 1.93 工具链限制，远端由 `security.yml` 的 zizmor-action 覆盖

## 2. 基础 CI 工作流

- [x] 2.1 新增 `.github/workflows/quality.yml`（`push: main`、`pull_request`、`merge_group`，`permissions: contents: read`，concurrency，`timeout-minutes: 10`）：复用 setup 后依次跑 `pnpm lint`、`pnpm format`、`pnpm format:root`、`pnpm check-types`；本地四个命令退出 0
- [x] 2.2 新增 `.github/workflows/test.yml`：跑 `pnpm test`，`if: always()` 上传 `apps/*/coverage` 与 `packages/*/coverage` 的 `lcov.info` / `coverage-summary.json`；本地 `pnpm test` 通过，8 个 coverage 文件存在
- [x] 2.3 新增 `.github/workflows/build.yml`：复用 setup 后跑 `pnpm build`，上传 `.next` / `dist` artifact（保留 7 天）；本地 `pnpm build` 退出 0，`apps/frontend/.next`、`apps/backend/dist`、`apps/bff/dist` 存在

## 3. 安全与依赖自动化

- [x] 3.1 新增 `.github/workflows/security.yml`：`zizmor` job（`security-events: write`、`actions: read`，checkout `persist-credentials: false`）+ `audit` job（复用 setup 后 `pnpm audit --audit-level=high`），`push: main`、`pull_request`、`schedule` 每周；本地 audit 退出 0，workflow 通过 YAML/schema 校验
- [x] 3.2 新增 `renovate.json`：`config:recommended` + `helpers:pinGitHubActionDigests`，周末 schedule，`minimumReleaseAge: "3 days"`，按 react / nestjs / testing / github-actions 分组，不自动合并，lockfile 维护；`renovate-config-validator` 校验通过
- [x] 3.3 评估 `pnpm audit` 的已知漏洞：如有不可修项，记录到 `pnpm.auditConfig.ignoreCves` 并写复查条件；当前 3 个 low / moderate 低于 high 门槛，不写 ignore，结论记入 design

## 4. Agent 审查

- [x] 4.1 新增 `.github/workflows/agent-review.yml`：`pull_request` opened/synchronize/ready_for_review，跳过 draft 与 fork PR，`pull-requests: write` + `id-token: write`，`timeout-minutes: 15`，concurrency 按 PR 取消；用 `anthropics/claude-code-action` 与 `ANTHROPIC_API_KEY`，prompt 写清项目红线与“不报告 linter 已覆盖的问题”；workflow 通过 YAML/schema 校验
- [x] 4.2 新增 `.github/copilot-instructions.md`，浓缩项目红线、注释规则、测试约定；文件包含上述三类约定

## 5. 协作文件

- [x] 5.1 新增 `.github/labeler.yml` 与 `.github/workflows/labeler.yml`（`pull-requests: write`），按 `apps/frontend`、`apps/backend`、`apps/bff`、`packages`、`.github`、`documentation` 打标签；两个文件通过 YAML 解析
- [x] 5.2 新增 `.github/CODEOWNERS`、`.github/pull_request_template.md`、`.github/ISSUE_TEMPLATE/{bug,feature,chore}.md`；按 GitHub 文档格式落盘

## 6. 文档与验证

- [x] 6.1 更新根 `README.md`：新增 CI 状态与工作流清单、Renovate 与 agent review 说明、required checks 建议；命令块不变
- [x] 6.2 更新根 `CLAUDE.md` 与 `AGENTS.md`：`.github` 目录职责、agent review 权限与 secrets、fork PR 行为、`minimumReleaseAge` 与 Renovate 对齐
- [x] 6.3 更新 `openspec/config.yaml` 的 `context`：补 CI 与自动化现状
- [x] 6.4 全量验证：`pnpm lint`、`pnpm format`、`pnpm format:root`、`pnpm check-types`、`pnpm test`、`pnpm build` 在本地全部退出 0；`openspec validate --all` 通过；远端 workflow 见 Remote verification

## Remote verification

- 推送分支并开 PR，确认 `quality` / `test` / `build` / `security` 四个 workflow 成功。
- 下载 `coverage` 与 `build-outputs` artifact，确认内容可读。
- 临时让一个测试失败，确认 `coverage` artifact 仍上传，然后恢复。
- 在内部 PR 观察 agent review 只评论、不 approve；确认 draft 与 fork PR 被跳过。
- 确认 labeler 自动打标签、CODEOWNERS 触发 review request。
- 在仓库 Secrets 配置 `ANTHROPIC_API_KEY`，观察一轮成本与误报后再考虑 required checks。

## Workflow follow-up

- 计划评审通过后，按 `openspec-apply-change` 实施。
- 实施与验证完成后，按 `openspec-archive-change` 归档到 `openspec/changes/archive/`。
