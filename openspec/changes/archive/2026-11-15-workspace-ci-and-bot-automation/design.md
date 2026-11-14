# Design

## Context

当前仓库没有 `.github/`，所有质量命令只能本地跑。参考仓库的实际拆分（全部来自 GitHub 原始工作流文件）：

| 仓库 | 拆分方式 | 关键文件 |
|---|---|---|
| [t3-oss/create-t3-app](https://github.com/t3-oss/create-t3-app/blob/main/.github/workflows/ci.yml) | 单个 `ci.yml` 内多 job（ESLint / Prettier / tsc / build），共用 `./.github/actions/setup` | `ci.yml`、`actions/setup/action.yml`、`labeler.yml`、`CODEOWNERS`、PR 模板 |
| [vercel/turborepo](https://github.com/vercel/turborepo/blob/main/.github/workflows/lint.yml) | `lint.yml` 用 `workflow_call`；`turbo run quality`；远程缓存仅在非 fork PR 开 | `lint.yml`、`turborepo-test.yml` |
| [pnpm/pnpm](https://github.com/pnpm/pnpm/blob/main/.github/workflows/ci.yml) | `ci.yml` 用 `dorny/paths-filter` 分 `compile-and-lint` / test；另有 `test.yml`、`audit.yml`、`codeql-analysis.yml`、`zizmor.yml` | 见左 |
| [pnpm/pnpm](https://github.com/pnpm/pnpm/blob/main/.github/workflows/pr-review-automation.yml) | 无权限的 `pull_request_review` 捕获 + `workflow_run` 的 privileged 后续 | 两个文件 |
| [oxc-project/oxc](https://github.com/oxc-project/oxc/blob/main/.github/workflows/security.yml) | 独立 security workflow，只跑 security-action | `security.yml`、`renovate.json`、`labeler.yml`、`copilot-instructions.md` |
| [pnpm CodeRabbit](https://github.com/pnpm/pnpm/blob/main/.coderabbit.yaml) | `path_filters` 排除 lockfile/dist；`path_instructions` 指定审查框架；自动打标签 | `.coderabbit.yaml` |
| [Claude Code Action solutions](https://github.com/anthropics/claude-code-action/blob/main/docs/solutions.md) | 自动 PR 审查：`pull_request` opened/synchronize，`contents: read` + `pull-requests: write` + `id-token: write` | `agent-review.yml` |

共同点：**安装逻辑抽成复合 action，工作流按关注点分文件，权限按 job 最小化，action 按 SHA 固定**。

## Goals / Non-Goals

**Goals:**

- 每个质量命令都有独立、可缓存的 CI 入口。
- 权限最小化，fork PR 不接触 secrets。
- 依赖升级与代码审查各自有独立配置文件，不互相耦合。
- 所有工作流可本地用 `act` 之外的方式验证 YAML 合法性与权限声明。

**Non-Goals:**

- 不做自动合并、不做 release 流程。
- 不引入 CodeRabbit / Dependabot / Copilot 订阅型服务（保留 `copilot-instructions.md` 作为可选）。
- 不配置 Turbo Remote Cache（规模未到）。
- 不改业务代码或 `turbo.json`。

## Decisions

### D1. 按职责拆文件，不做单一 `ci.yml`

```text
.github/
├── actions/setup/action.yml
├── workflows/
│   ├── quality.yml      # lint + format + format:root + check-types
│   ├── test.yml         # test + coverage artifact
│   ├── build.yml        # build + artifact
│   ├── security.yml     # zizmor + audit（+ 可选 CodeQL）
│   ├── agent-review.yml # Claude 审查
│   └── labeler.yml      # PR 自动打标签
├── CODEOWNERS
├── labeler.yml
├── copilot-instructions.md
├── pull_request_template.md
└── ISSUE_TEMPLATE/
renovate.json
```

理由：

- `quality` / `test` / `build` 触发条件相同，但失败语义不同；分开后 branch protection 可以只 required `quality` 与 `test`，`build` 用 `workflow_dispatch` 或 nightly。
- `security` 需要 `security-events: write` 与定时触发，权限与普通 CI 完全不同。
- `agent-review` 需要 `pull-requests: write` 和 secrets，且要跳过 fork PR；放进 `ci.yml` 会让整个 workflow 获得写权限。
- `labeler` 只需 `pull-requests: write`，且应在其他 job 之前跑（t3 的做法）。

替代方案：单文件多 job。放弃，因为 required checks 会随文件漂移，权限无法按 job 精细控制。

### D2. 复合 action 只做安装

```yaml
# .github/actions/setup/action.yml
name: Setup
runs:
  using: composite
  steps:
    - uses: pnpm/action-setup@v5
      with:
        version: 12.18.0
    - uses: actions/setup-node@v6
      with:
        node-version-file: .nvmrc
        cache: pnpm
    - run: pnpm install --frozen-lockfile
      shell: bash
```

- `pnpm/action-setup` 必须在 `setup-node` 之前，否则 `cache: pnpm` 找不到 pnpm。
- `node-version-file: .nvmrc` 让本地与 CI 用同一个 Node 版本。
- `--frozen-lockfile` 保证 CI 不改 lockfile；本地已验证通过。
- 不在复合 action 里跑 lint/test，避免各 job 的日志混在一起。

### D3. 触发策略

```yaml
on:
  push:
    branches: [main]
  pull_request:
  merge_group:
```

- `push` 只跑 `main`，避免分支 push 与 PR 对同一 commit 重复上报 required check（pnpm 在 `ci.yml` 注释里明确说明这个坑）。
- `merge_group` 保证 merge queue 也会跑（如果将来启用）。
- `concurrency`：

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.event_name }}-${{ github.event.pull_request.number || github.run_id }}
  cancel-in-progress: ${{ github.event_name == 'pull_request' }}
```

### D4. 权限模型

| workflow | permissions |
|---|---|
| quality / test / build | `contents: read` |
| security | `contents: read`、`security-events: write`、`actions: read` |
| agent-review | `contents: read`、`pull-requests: write`、`id-token: write` |
| labeler | `contents: read`、`pull-requests: write` |

- 所有 `actions/checkout` 加 `persist-credentials: false`。
- action 全部按 SHA 固定，`renovate` 的 `helpers:pinGitHubActionDigests` 自动更新。

### D5. `quality.yml` 内容

```yaml
jobs:
  quality:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@<sha>
        with: { persist-credentials: false }
      - uses: ./.github/actions/setup
      - run: pnpm lint
      - run: pnpm format
      - run: pnpm format:root
      - run: pnpm check-types
```

- 四个命令串行在同一 job：都依赖同一份 install，分开 job 会重复安装。
- `format:root` 覆盖根配置文件，与配置审查变更的脚本对应。
- `timeout-minutes` 防止挂起。

### D6. `test.yml` 与覆盖率

```yaml
- run: pnpm test
- uses: actions/upload-artifact@<sha>
  if: always()
  with:
    name: coverage
    path: |
      apps/*/coverage/lcov.info
      apps/*/coverage/coverage-summary.json
      packages/*/coverage/lcov.info
      packages/*/coverage/coverage-summary.json
    retention-days: 7
```

- `if: always()` 保证测试失败时也能拿到覆盖率。
- 不引第三方覆盖率服务，先存 artifact；将来接 Codecov 只需加一个 step。

### D7. `security.yml`

```yaml
permissions:
  contents: read
  security-events: write
  actions: read
jobs:
  zizmor:
    steps:
      - uses: actions/checkout@<sha>
        with: { persist-credentials: false }
      - uses: zizmorcore/zizmor-action@<sha>
  audit:
    steps:
      - uses: ./.github/actions/setup
      - run: pnpm audit --audit-level=high
```

- `zizmor` 只扫 `.github/workflows`，不需要 Node；与 `audit` 拆 job 避免 install 拖慢。
- `pnpm audit` 失败会让 PR 红；对已知不可修漏洞用 `pnpm.auditConfig.ignoreCves`（记录 issue 号）。
- CodeQL 可选：`javascript` 语言，`schedule` 每周一次，不放进 PR 必过检查。

### D8. `agent-review.yml`

基于官方 Automatic PR Code Review 示例：

```yaml
on:
  pull_request:
    types: [opened, synchronize, ready_for_review]

jobs:
  review:
    if: >-
      github.event.pull_request.draft == false &&
      github.event.pull_request.head.repo.full_name == github.repository
    runs-on: ubuntu-latest
    timeout-minutes: 15
    concurrency:
      group: agent-review-${{ github.event.pull_request.number }}
      cancel-in-progress: true
    permissions:
      contents: read
      pull-requests: write
      id-token: write
    steps:
      - uses: actions/checkout@<sha>
        with: { fetch-depth: 0, persist-credentials: false }
      - uses: anthropics/claude-code-action@<sha>
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          use_sticky_comment: true
          prompt: |
            REPO: ${{ github.repository }}
            PR NUMBER: ${{ github.event.pull_request.number }}
            ...按官方 code-review 协议审查...
          claude_args: |
            --allowedTools "mcp__github_inline_comment__create_inline_comment,Bash(gh pr comment:*),Bash(gh pr diff:*),Bash(gh pr view:*),Bash(gh pr list:*),Bash(git blame:*),Bash(git log:*)"
```

- 跳过 draft 与 fork PR：fork 没有 secrets，注入会失败并产生红色 check。
- 只评论，不 `approve`、不 push；符合“关键节点由人确认”。
- `concurrency` 按 PR 取消旧运行，`timeout-minutes` 限成本。
- `fetch-depth: 0`：审查协议里有 git blame / git log 这一路，浅克隆拿不到历史。本仓库 `.git` 约 15 MB，代价可接受。
- `use_sticky_comment: true`：同一 PR 只保留一条评论，重跑时更新，不刷屏。
- prompt 采用 Anthropic 官方 `code-review` 插件的协议（`plugins/code-review/commands/code-review.md`）：
  - 先做资格判断（closed / draft / 自动化 PR / 已审过）再开审；
  - 读根与包级 `CLAUDE.md`、`.claude/rules/*.md` 作为规则来源；
  - 五个独立视角：规则一致性、diff 内明显 bug、git 历史、历史 PR 评论、代码注释矛盾；
  - 每个问题 0-100 置信度打分，门槛 80，低于门槛丢弃；
  - 明确的 false-positive 清单，包含 linter / typechecker / 测试已覆盖的问题、改动前存在的问题、未修改的行；
  - 输出含完整 SHA 的代码链接，前后各留至少 1 行上下文。
- 与 `quality.yml` 分工：格式与类型问题由 CI 负责，agent review 只报行为与规则层面的问题。

### D9. `renovate.json`

```json
{
  "extends": ["config:recommended", "helpers:pinGitHubActionDigests"],
  "schedule": ["every weekend"],
  "minimumReleaseAge": "3 days",
  "packageRules": [
    { "matchPackageNames": ["next", "react", "react-dom"], "groupName": "react" },
    { "matchPackageNames": ["@nestjs/*"], "groupName": "nestjs" },
    { "matchPackageNames": ["vitest", "@vitest/*", "@testing-library/*"], "groupName": "testing" },
    { "matchManagers": ["github-actions"], "groupName": "github-actions" },
    { "matchUpdateTypes": ["patch"], "automerge": false }
  ],
  "lockFileMaintenance": { "enabled": true, "schedule": ["every weekend"] }
}
```

- pnpm catalog 由 Renovate 的 `pnpm` manager 识别；`workspace:*` 不会被升级。
- 与 `minimumReleaseAge: 1440` 对应，Renovate 侧也设 `minimumReleaseAge: "3 days"`，避免提出刚发布的版本。
- 不自动合并；评审通过后手动 merge。

### D10. 协作文件

- `CODEOWNERS`：`* @HuayanZhong`；`/apps/frontend/`、`/packages/ui/`、`/apps/backend/`、`/apps/bff/` 分别指定。
- `labeler.yml`：`apps/frontend`、`apps/backend`、`apps/bff`、`packages`、`.github`、`documentation`。
- `pull_request_template.md`：变更类型、验证命令、OpenSpec 变更链接、影响面。
- `ISSUE_TEMPLATE/`：bug、feature、chore。
- `copilot-instructions.md`：项目红线、注释规则、测试约定、不要改被测代码。

### D11. 落地顺序

1. `actions/setup` + `quality.yml` + `test.yml`，先让 PR 有基本门禁。
2. `build.yml` + `security.yml`。
3. `renovate.json` + `labeler.yml` + `CODEOWNERS` + 模板。
4. `agent-review.yml` 最后上，先在内部 PR 观察误报与成本。
5. branch protection 把 `quality` / `test` 设为 required。

## Risks / Trade-offs

- [agent review 误报与成本] → 只评论不 approve；`paths` 过滤；`timeout-minutes`；先观察一轮再设为 required。
- [fork PR 无法跑 agent review] → 明确跳过；fork 仍跑 quality/test/build。
- [CI 总时长上升] → Turbo 缓存 + 复合 action 复用；`quality` 四命令串行仍应在 10 分钟内。
- [`pnpm audit` 可能因下游漏洞阻塞] → 记录 ignore 列表与复查条件。
- [Renovate 与 `minimumReleaseAge` 冲突] → 两边都设 3 天，保持一致。
- [required checks 配错阻塞 PR] → 先不 required，观察一周后逐项开启。
- [`.github` 文件被 Oxfmt 格式化] → `.github` 与 `renovate.json` 已加入根 `format:root` 脚本与 `//#format:root` inputs。

## Implementation Notes

- `pnpm audit --audit-level=high` 当前退出 0；存在 3 个 low / moderate 漏洞：`deepmerge`（无修补版本）、`glob`（≥14.0.2 修补）、`minimatch`（≥11.0.1 修补）。均低于 CI 的 high 门槛，暂不写 `pnpm.auditConfig.ignoreCves`；升级到修补版本或出现 high 时再处理。
- `format:root` 已覆盖 `.github/` 与 `renovate.json`，本地检查 16 个文件通过。
- 本地可用 `@action-validator/cli` 与 PyYAML 做语法/schema 校验；actionlint / zizmor 二进制与 PyPI 下载在 Windows 环境受限，最终以 CI 的 `zizmor-action` 为准。

## Open Questions

无（pnpm audit、CodeQL、agent review 凭证与 Copilot 取舍已在实施中确定：PR 跑 high 门槛的 audit、暂不启用 CodeQL、agent review 用 `ANTHROPIC_API_KEY`、只保留 Copilot instructions 文件）。
