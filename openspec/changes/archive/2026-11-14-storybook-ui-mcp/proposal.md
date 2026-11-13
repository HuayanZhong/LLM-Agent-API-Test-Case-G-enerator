# Proposal

## Why

`packages/ui` 目前只有源码和一份 README，组件没有独立的预览、文档和交互入口；agent 也缺少读取组件 props 与生成 story 的工具。Storybook 10.6 提供 MCP addon，可以把组件 manifest 与 story 预览暴露给 Claude Code，让 UI 开发从“改完等下一次 `next dev`”变成“在 Storybook 里即时验证、由 agent 读取组件 API”。

## What Changes

- 在 `packages/ui` 引入 Storybook 10.6：
  - `@storybook/react-vite`（Vite builder，不依赖 Next）
  - `@storybook/addon-docs`、`@storybook/addon-a11y`、`@storybook/addon-themes`
  - `@storybook/addon-mcp`，暴露 `http://localhost:6006/mcp`
- 在 `.storybook/main.ts` 打开 `features.componentsManifest`，让 MCP 的 docs 工具集能读取 `Button` / `Card` 的 props。
- 为现有 `button`、`card` 各写一份 story，放在 `packages/ui/stories/`，与发布源码 `src/` 分离。
- `.storybook/preview.tsx` 引入 `src/styles/globals.css`，并接入明暗主题切换。
- 新增脚本：`storybook dev -p 6006`、`build-storybook`；不并入根 `pnpm dev`。
- 新增 `storybook` catalog，依赖版本集中管理。
- `.mcp.json` 增加 Storybook HTTP server，Storybook dev 运行时可用。
- 更新 `packages/ui` 三份文档与根索引，记录 Storybook 与 MCP 的启动方式。
- **不引入** Vitest、`@storybook/addon-vitest`、Playwright；MCP 的 `test-run` 工具暂不可用。

## Capabilities

### New Capabilities

无。本次是开发工具与文档变更，不改变系统行为；`.openspec.yaml` 已声明 `skip_specs: true`。

### Modified Capabilities

无。

## Impact

- 新增：`packages/ui/.storybook/`、`packages/ui/src/components/*.stories.tsx`、`packages/ui` 的 Storybook 依赖与脚本
- 修改：`pnpm-workspace.yaml`（新增 `storybook` catalog）、`packages/ui/package.json`、`.mcp.json`
- 文档：`packages/ui/README.md`、`CLAUDE.md`、`AGENTS.md`；根 `README.md` / `CLAUDE.md` / `AGENTS.md` 的包级入口
- 端口：新增 6006（Storybook），不改变 3000 / 4000 / 5000
- 不涉及：Vitest / Playwright、组件实现变更、前端页面
