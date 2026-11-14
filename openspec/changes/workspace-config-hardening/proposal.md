## Why

配置审查发现三个会直接阻断 CI 的问题：`turbo run build` 不存在，CI 无法统一构建与缓存；`packages/ui` 的 `__tests__/utils.test.ts` 因 `include` 只匹配 `.test.tsx` 而从未执行；`.editorconfig` 未进入 Turbo 缓存输入，改了缩进仍命中旧缓存。这些必须在搭建 CI 之前修掉，否则 CI 会建立在不完整、不可信的配置上。

## What Changes

- `turbo.json` 新增 `build` 任务（`dependsOn: ["^build"]`，输出 `.next/**`、`dist/**`、`storybook-static/**`），根 `package.json` 增加 `build` 包装脚本。
- `apps/frontend` 与 `packages/ui` 的 Vitest `include` 改为 `__tests__/**/*.test.{ts,tsx}`，让 `.test.ts` 也进入测试与覆盖率统计。
- `turbo.json` 的 `globalDependencies` 增加 `.editorconfig`、`.nvmrc`，让 Oxfmt 读取的编辑器配置与 Node 版本变更能失效缓存。
- 根 `package.json` 增加 `format:root` / `format:root:fix`，覆盖不属于任何 workspace 包的根配置文件；`turbo.json` 注册对应根任务（`//#format:root`、`//#format:root:fix`）。
- `.gitignore` 增加 `.worktrees/`，让 worktree 目录在干净克隆里也是 ignored。
- `.mcp.json` 移除常驻 Storybook HTTP 端点（仅 dev 时可用，常驻会导致每次会话 `ECONNREFUSED`），改为文档说明按需启用。
- 修正 `.mcp.json` / `README.md` / `CLAUDE.md` 中“只含 chrome-devtools”与实际的偏差，并在 README 目录树补 `.nvmrc`、`.editorconfig`、`.gitattributes`、`skills-lock.json`。
- 覆盖率 reporter 增加 `lcov` 与 `json-summary`，便于后续 CI 上传与门禁。
- 修正 `pnpm-workspace.yaml` 中 `minimumReleaseAgeExclude` 的注释与实际条目不符，并显式写出 `minimumReleaseAge: 1440`。
- 六个 workspace 包的 `package.json` 补齐 `description`、`license`、`engines`，统一 `version: 0.0.0`，消除 `0.0.1` / `0.0.0` 混用。

**不包含**：不新增 `.github/` 工作流与机器人配置（另开变更）；不改 Nest 构建链路；不调整 TS strictness 选项；不做覆盖率合并报告。

## Capabilities

无 spec 级行为变更，只调整工具链配置与命令。`.openspec.yaml` 置 `skip_specs: true`。

## Impact

- 配置：`turbo.json`、根 `package.json`、`.gitignore`、`.mcp.json`、`.editorconfig`、`pnpm-workspace.yaml`、`packages/vitest-config/src/index.ts`。
- 测试：`apps/frontend/vitest.config.ts`、`packages/ui/vitest.config.ts`；UI 测试数从 4 变为 5，需重新确认行覆盖率。
- 命令：新增根 `typecheck` 之外的 `build`、`format:root`、`format:root:fix`。
- 文档：根 `README.md`、`CLAUDE.md`、`AGENTS.md`、`packages/ui/CLAUDE.md`、`packages/vitest-config/README.md`、`openspec/config.yaml`。
- 风险：`build` 任务会改变缓存键与任务图；`.mcp.json` 移除 Storybook 端点会改变 AI 工具可用性，需要在文档里写清启用方式。
