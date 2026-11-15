# Tasks

## 1. 依赖与 Changesets 配置

- [x] 1.1 在 `pnpm-workspace.yaml` 的 `tooling` catalog 增加 `@changesets/cli`（`^3.0.3`），根 `package.json` 增加 devDependency 与 `changeset` / `changeset:version` / `changeset:status` 脚本；执行 `pnpm install`，验证 `pnpm exec changeset --version` 输出 3.x
- [x] 1.2 创建 `.changeset/config.json`：`$schema` 用 `https://unpkg.com/@changesets/config@4/schema.json`，`fixed` 组列出九个 workspace 包，`privatePackages: { version: true, tag: false }`，`changelog: false`、`commit: false`、`baseBranch: "main"`、`access: "restricted"`；验证 `pnpm changeset:status` 能运行
- [x] 1.3 创建 `scripts/sync-version.mjs`：读取九个包版本、不一致时非零退出、一致时写回根 `package.json`；验证脚本连续运行两次结果一致，且当前九个包与根版本均为 0.0.0 时能通过
- [x] 1.4 把 `.changeset/config.json` 加入根 `format:root` / `format:root:fix` 文件清单与 `turbo.json` 的 `//#format:root` inputs；验证 `pnpm format:root` 退出码 0

## 2. Release workflow

- [x] 2.1 解析 `changesets/action@v2.1.2` 的 commit SHA（沿用仓库固定 SHA 的约定），创建 `.github/workflows/release.yml`：push main 触发、`contents: write` / `pull-requests: write`、checkout `fetch-depth: 0`、`paths` 过滤、`concurrency`、运行 `pnpm changeset:version`、不配置 publish；验证 `pnpm format:root` 通过且 YAML 可解析
- [x] 2.2 检查 release workflow 与现有 `quality` / `test` 的触发不冲突：Version Packages PR 仍会跑必需检查；验证 workflow 文件中的分支与权限声明符合仓库约定

## 3. 文档与索引

- [x] 3.1 更新 `README.md`：新增 `pnpm changeset` / `changeset:version` / `changeset:status` 说明与「changeset → Version Packages PR → 合并」流程；验证命令能在仓库根执行
- [x] 3.2 更新 `CLAUDE.md` 与 `AGENTS.md`：版本策略（fixed 九包同版本）、根版本同步、Release workflow 与 `GITHUB_TOKEN` 权限；验证文中路径存在
- [x] 3.3 更新 `openspec/config.yaml` 的 `context`，写入 Changesets 固定版本策略与自动版本 PR；验证 `openspec validate --all` 退出码 0

## 4. 集成验证

- [x] 4.1 创建临时 changeset，执行 `pnpm changeset:version`，确认九个包与根 `package.json` 版本一致、`apps/desktop` 版本变化会反映到产物名；验证后删除临时 changeset 并恢复版本改动
- [x] 4.2 在仓库根执行 `pnpm sherif`、`pnpm knip`、`pnpm check-types`、`pnpm lint`、`pnpm format`、`pnpm format:root`、`pnpm test`、`pnpm build`，确认全部退出码 0

## Workflow follow-up

- 实现与验证完成后运行 `openspec-archive-change` 归档本变更；本变更已声明 `skip_specs: true`，归档时无需同步主规格。
