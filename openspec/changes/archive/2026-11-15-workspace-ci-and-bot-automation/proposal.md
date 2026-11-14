## Why

仓库目前没有任何 CI、依赖升级机器人或代码审查自动化。质量命令（`lint`、`format`、`check-types`、`test`、`build`）只能靠本地手动执行，PR 没有门禁；依赖版本靠人记；AI 审查能力只在本地会话里，没有进入 PR 流程。所有配置都堆在一个 `ci.yml` 里会让权限、触发条件与 fork PR 处理互相牵制，所以需要按职责拆文件。

## What Changes

- 新增 `.github/actions/setup/action.yml` 复合 action：`pnpm/action-setup` + `actions/setup-node`（`node-version-file: .nvmrc`、`cache: pnpm`）+ `pnpm install --frozen-lockfile`，所有工作流复用。
- 新增四个独立工作流：
  - `quality.yml`：`pnpm lint`、`pnpm format`、`pnpm format:root`、`pnpm check-types`。
  - `test.yml`：`pnpm test`，上传 `coverage/lcov.info` 与 `coverage-summary.json` 为 artifact。
  - `build.yml`：`pnpm build`，产出 `.next` / `dist` 作为 artifact（保留 7 天）。
  - `security.yml`：`zizmor` 扫描 workflow 自身 + `pnpm audit` + 可选 CodeQL。
- 新增 `agent-review.yml`：Claude Code Action 对 PR 做只评论、不 approve 的审查；跳过 draft 与 fork PR；`timeout-minutes` 与 concurrency 限制成本。
- 新增 `renovate.json`：pnpm catalog、`workspace:*`、GitHub Actions digest 固定；按 package 分组，周末运行。
- 新增协作文件：`.github/CODEOWNERS`、`.github/labeler.yml` + `labeler.yml` 工作流、`pull_request_template.md`、`ISSUE_TEMPLATE/`。
- 新增 `.github/copilot-instructions.md`，把仓库约定（只诊断不改码、测试报告是唯一交付物、注释规则）浓缩给 Copilot review。
- 所有 workflow 统一：`permissions` 默认 `contents: read`、`concurrency` 按 PR/ref 取消旧运行、action 按 SHA 固定、`push` 只跑 `main` + `merge_group`。

**不包含**：不引入 CodeRabbit、Dependabot（与 Renovate 分工重叠）；不做 Turbo Remote Cache；不做自动合并；不改 `turbo.json` 与业务代码。

## Capabilities

无 spec 级行为变更，只新增仓库自动化配置。`.openspec.yaml` 置 `skip_specs: true`。

## Impact

- 新增：`.github/` 下约 10 个文件、根 `renovate.json`。
- 依赖：无新增 npm 依赖；GitHub Actions 由 Renovate 维护。
- 密钥：`ANTHROPIC_API_KEY`（或 OAuth token）需在仓库 Secrets 配置；fork PR 不注入。
- 文档：根 `README.md`、`CLAUDE.md`、`AGENTS.md`、`openspec/config.yaml`。
- 风险：agent review 成本与误报；CI 时长；required checks 配置错误会阻塞 PR。需要先在内部 PR 观察一轮。
