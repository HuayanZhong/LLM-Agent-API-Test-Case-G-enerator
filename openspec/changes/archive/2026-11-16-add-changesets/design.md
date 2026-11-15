# Design

## Context

见 `proposal.md`。九个 workspace 包（4 个 app、5 个 packages）当前都是 `private: true`、`version: "0.0.0"`；`apps/desktop` 的版本会被 Electron Forge 用于产物名。仓库已有 commitlint + conventional commits、Renovate 管依赖、`quality` / `test` 两个必需检查。Changesets 最新 CLI 为 `3.0.3`，配置包 `@changesets/config` 为 `4.0.1`，`changesets/action` 最新 tag 为 `v2.1.2`。

## Goals / Non-Goals

**Goals:**

- 九个包共用一个产品版本，一次 Version Packages PR 全部升级。
- 根 `package.json` 与产品版本保持同步。
- main 上自动开/更新版本 PR，人工合并后才生效。
- 版本变化可追溯到 changeset 文件与 PR。

**Non-Goals:**

- 不发布 npm 包；`privatePackages.tag: false`，不打 tag、不创建 GitHub Release。
- 不改依赖版本管理（仍由 catalogs + Renovate 负责）。
- 不引入 Release Please / semantic-release 等重叠工具。
- 不改 `engines` / `packageManager` / `.nvmrc`。

## Decisions

### 1. 用 Changesets 的 `fixed` 组，九个包同版本

`.changeset/config.json` 的 `fixed` 里列出全部九个包名：

```json
"fixed": [[
  "desktop", "frontend", "backend", "bff",
  "@workspace/ui", "@workspace/types", "@workspace/config",
  "@workspace/typescript-config", "@workspace/vitest-config"
]]
```

`fixed` 组保证任一包被 changeset 命中时，所有成员一起升到同一版本。备选「各包独立版本」会让共享包与应用版本发散，产物与论文交付对不上，不采用。

### 2. 私有包只升版本，不 tag、不发布

```json
"privatePackages": { "version": true, "tag": false },
"access": "restricted",
"commit": false,
"baseBranch": "main",
"updateInternalDependencies": "patch",
"changelog": false
```

`version: true` 让私有包参与版本计算；`tag: false` 避免为九个私有包创建 git tag；`commit: false` 因为版本变更由 CI 的 Version Packages PR 提交，本地 `changeset version` 不应自动 commit。`changelog: false` 避免固定组产生九份重复 CHANGELOG，发布说明由 Version Packages PR 的 changeset 内容承载；若以后需要逐包 changelog，再启用 `@changesets/cli/changelog`。

### 3. 根 `package.json` 版本用脚本同步

Changesets 只管理 workspace 包，根包不在 `packages/*` 中。`scripts/sync-version.mjs`：

1. 读取九个包的 `version`，若不一致直接非零退出；
2. 取该版本写入根 `package.json`；
3. 运行 `pnpm changeset:version` 时排在 `changeset version` 之后。

脚本不修改各包版本（那是 Changesets 的职责），只保证根版本与产品版本一致。

### 4. 本地流程与 CI 流程分开

- 本地：每个需要发布的 PR 执行 `pnpm changeset`，选择 patch / minor / major，提交 `.changeset/*.md`；`pnpm changeset:status` 查看待发布内容。
- CI：push 到 main 后，`.github/workflows/release.yml` 用 `changesets/action@v2.1.2`（按仓库约定固定 SHA）运行 `pnpm changeset:version`，开或更新 Version Packages PR；不提供 `publish` 命令，因此不会发布 npm 包。工作流用 `paths` 过滤，只在 `.changeset/**`、各 `package.json`、`scripts/sync-version.mjs` 与 workflow 自身变化时触发，并加 `concurrency: release-${{ github.ref }}` 避免并发开 PR。
- Version Packages PR 同样跑 `quality` 与 `test`；合并后才完成版本更新。

### 5. Release workflow 的权限与 checkout 例外

```yaml
permissions:
  contents: write
  pull-requests: write
```

机器人需要创建分支与 PR、推送提交。checkout 保持 `fetch-depth: 0` 以便 Changesets 读取历史；`persist-credentials` 在这个 workflow 里设为默认（true），因为 action 需要 push，这与其它 workflow 的 `false` 约定不同，会在注释里说明。`GITHUB_TOKEN` 通过 `env` 传入。

### 6. 配置与工具链的接入点

- `@changesets/cli` 进 `tooling` catalog 与根 devDependencies；`pnpm-lock.yaml` 更新。
- `.changeset/config.json` 的 `$schema` 用官方 `https://unpkg.com/@changesets/config@4/schema.json`（已验证 200），并加入 `pnpm format:root` 与 Turbo `//#format:root` inputs。
- `scripts/sync-version.mjs` 由 `package.json` 脚本引用，knip 能识别为入口；`.changeset/*.md` 是文档，knip 不扫描。
- 首次执行 `changeset version` 前所有包仍是 `0.0.0`；第一个 changeset 建议用 `minor` 到 `0.1.0`，论文交付时可再用 `major` 到 `1.0.0`。

## Risks / Trade-offs

- [Version Packages PR 需要写权限] → workflow 显式声明 `contents: write` / `pull-requests: write`；如果仓库分支保护禁止 Actions 创建 PR，需要调整规则。
- [`fixed` 组让任何变更都升全部包] → 这是「一个产品版本」的预期行为；不想升级的改动不要写 changeset。
- [根版本漏同步] → `changeset:version` 固定串联脚本；脚本发现九包版本不一致会直接失败。
- [changelog 缺失] → 发布说明在 Version Packages PR 中；需要逐包 changelog 时再改配置。
- [Action SHA 过期] → Renovate 的 github-actions 分组会更新 SHA；升级时确认 `changesets/action` 大版本兼容。
- [首次版本号选择] → 0.1.0 或 1.0.0 由第一次 changeset 决定，不影响结构。

## Migration Plan

单次提交，无运行时迁移。顺序：catalog + 根依赖 → `.changeset/config.json` → `scripts/sync-version.mjs` → 根脚本 → release workflow → 文档。验证：`pnpm changeset:status` 可运行、`pnpm format:root` / `pnpm knip` / `pnpm check-types` / `pnpm test` 通过；用一个临时 changeset 跑 `changeset version`，确认九包与根版本一致后 `git checkout` 回滚临时变更。回滚直接 revert 本次提交。

## Open Questions

- 首个正式版本用 `0.1.0` 还是 `1.0.0`？由第一次 `pnpm changeset` 的级别决定，不影响任务拆分；交付前再定。
