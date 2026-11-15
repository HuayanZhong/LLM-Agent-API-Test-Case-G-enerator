# Proposal

## Why

九个 workspace 包的 `version` 全部停在 `0.0.0`，没有任何发布或版本记录机制；`apps/desktop` 的版本还会决定 Electron Forge 产物名（ZIP / exe）。当前只能手工逐包改版本，容易漏改、也无法从 git 历史看出「这次交付对应哪个版本」。用 Changesets 的固定组把九个私有包绑成一个产品版本，合并到 main 后自动开 Version Packages PR，版本与交付物一一对应。

## What Changes

- 根 `devDependencies` 增加 `@changesets/cli`（`catalog:tooling`），提供 `pnpm changeset`（记录变更）、`pnpm changeset:version`（升版本并同步根版本）、`pnpm changeset:status`。
- 新增 `.changeset/config.json`：`fixed` 组包含九个 workspace 包，`privatePackages: { version: true, tag: false }`，`changelog` 使用默认的 `@changesets/cli/changelog`（Version Packages PR 需要读取各包 CHANGELOG.md），`commit: false`，`baseBranch: "main"`，`access: "restricted"`。
- 新增 `scripts/sync-version.mjs`：校验九个包版本一致后，把同一版本写回根 `package.json`；根包不在 Changesets 的 workspace 范围内，需要单独同步。
- 新增 `.github/workflows/release.yml`：push 到 main 时用 `changesets/action` 开或更新 Version Packages PR；只升版本，不执行 npm publish。
- `.changeset/config.json` 纳入 `pnpm format:root` / Turbo 根任务 inputs。
- 同步 README / CLAUDE / AGENTS 的命令与发布流程，以及 `openspec/config.yaml` 的 `context`。
- 不改变：依赖版本（仍由 catalogs + Renovate 管理）、`engines` / `packageManager`、任何应用的运行时行为。

## Capabilities

### New Capabilities

无。这是发布与版本管理工具链改动，没有可观察的系统行为变化，变更以 `skip_specs: true` 声明。

### Modified Capabilities

无。

## Impact

- 根 `package.json`：`changeset` / `changeset:version` / `changeset:status` 脚本、`@changesets/cli` devDependency、`format:root` 文件清单。
- `pnpm-workspace.yaml`：`tooling` catalog 增加 `@changesets/cli`；`pnpm-lock.yaml` 更新。
- 新增 `.changeset/config.json`、`scripts/sync-version.mjs`、`.github/workflows/release.yml`。
- 首次执行 `changeset version` 时，九个包与根 `package.json` 的版本会一起变化；`apps/desktop` 的产物名随之变化。
- 文档：根 `README.md` / `CLAUDE.md` / `AGENTS.md`、`openspec/config.yaml` 的 `context`。
- 风险：Version Packages PR 需要 `contents: write` 与 `pull-requests: write`；仓库若启用分支保护，需要允许 GitHub Actions 创建 PR；Release workflow 的 `changesets/action` 必须按仓库约定固定 SHA。
