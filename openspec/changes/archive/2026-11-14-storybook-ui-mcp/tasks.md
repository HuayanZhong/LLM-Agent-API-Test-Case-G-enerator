# Tasks

## 1. 依赖与 Catalog

- [x] 1.1 在 `pnpm-workspace.yaml` 新增 `storybook` catalog（`storybook`、`@storybook/react-vite`、`addon-docs`、`addon-a11y`、`addon-themes`、`addon-mcp`、`vite`），版本按 design D6；验证 `pnpm install` 退出 0。
- [x] 1.2 在 `packages/ui/package.json` 增加 Storybook devDependencies（全部 `catalog:storybook`）与 `storybook`、`build-storybook` 脚本；验证 `pnpm --filter @workspace/ui exec storybook --version` 输出版本号，且脚本列表包含两个新脚本。

## 2. Storybook 配置

- [x] 2.1 新建 `packages/ui/.storybook/main.ts`：stories glob 指向 `../src/**/*.stories.@(js|jsx|mjs|ts|tsx)`，addons 含 docs / a11y / themes / mcp，framework 为 `@storybook/react-vite`，`features.componentsManifest: true`；验证 `pnpm --filter @workspace/ui storybook` 能在 6006 启动且无配置错误。
- [x] 2.2 新建 `packages/ui/.storybook/preview.tsx` 与 `storybook.css`：preview 导入 `storybook.css`，后者 `@import "../src/styles/globals.css"` 并 `@source "../stories/**/*.{ts,tsx}"`；用 `withThemeByClassName` 接入 `light` / `dark`。验证 6006 页面有 Tailwind 基础样式，切换主题时 `.dark` class 生效。
- [x] 2.3 验证 Storybook 是否复用 `packages/ui/postcss.config.mjs`；若 Tailwind 未生效，补 `.storybook/postcss.config.mjs` re-export 同一插件配置，并以 6006 实际样式为准。

## 3. Stories

- [x] 3.1 新建 `packages/ui/stories/button.stories.tsx`（CSF 3：`Meta` / `StoryObj` / `export default meta`），覆盖 Primary、Secondary、Outline、Ghost、Destructive 与 `size` / `disabled`；展示名与 docs 描述用中文，export 标识符保持英文。验证 6006 侧栏出现 `UI/Button` 与中文 story 名，每个 story 正常渲染。
- [x] 3.2 新建 `packages/ui/stories/card.stories.tsx`，覆盖完整 Card 组合（Header / Title / Description / Content / Footer）；展示名与 docs 描述用中文。验证 6006 侧栏出现 `UI/Card` 与中文 story 名，Autodocs 能展示 props 与中文描述。

## 4. MCP

- [x] 4.1 在 `.mcp.json` 增加 `storybook` HTTP server（`http://127.0.0.1:6006/mcp`）；验证 Storybook dev 运行时对该端点 POST `initialize` 返回 200，且响应头带 `mcp-session-id`。
- [x] 4.2 对 `/mcp` 发 JSON-RPC `initialize` + `tools/list`，验证返回的工具包含 `docs-list` / `docs-show` / `stories-preview`，且不包含 `test-run`；再调用 `docs-list`，验证能看到 `Button` 与 `Card`。

## 5. 文档

- [x] 5.1 更新 `packages/ui/README.md`、`CLAUDE.md`、`AGENTS.md`：Storybook 命令、6006、MCP 端点只在 dev 时可用、CSF 3、story 放 `stories/` 且展示名/描述用中文；验证三份文件中的命令与 `package.json` 一致、链接可达。
- [x] 5.2 更新根 `README.md`（端口表补 6006）、`CLAUDE.md`（包级文档条目补 Storybook）、`AGENTS.md`（索引补 MCP 入口）；验证根端口表与包 README 一致，链接可达。

## 6. 集成验证

- [x] 6.1 执行 `pnpm --filter @workspace/ui build-storybook`，验证退出码 0 且 `storybook-static` 产物生成。
- [x] 6.2 检查依赖树，验证未安装 `vitest`、`@vitest/browser*`、`playwright`；确认本次只接入 MCP 的 docs + development 工具集。

## Workflow follow-up

- 完成 review 后用 `openspec-archive-change` 归档。
- 测试栈统一后另开变更：加 `@storybook/addon-vitest` + Vitest + `@vitest/browser-playwright`，打开 `test-run`。
