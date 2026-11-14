# CLAUDE.md

本文件是 `packages/ui` 的包级规则。项目级规则见 [../../CLAUDE.md](../../CLAUDE.md)。

## 本包职责

`@workspace/ui`：shadcn 组件、`cn()`、Tailwind v4 样式与主题变量。只发源码，由 Next 转译。

## 目录与入口

- 组件：`src/components/`；工具：`src/lib/utils.ts`；样式：`src/styles/globals.css`。
- `package.json` 的 `exports` 决定外部可引用的路径；新增顶层目录必须补 export。
- `components.json` 的 aliases 全部指向 `@workspace/ui/*`。

## 本包约束

- 组件只用 CLI 安装：在仓库根执行 `pnpm dlx shadcn@latest add <component> -c apps/frontend`；不要手工新建 `src/components/*` 冒充 registry 组件。
- 不要把页面、路由、业务逻辑放进本包；这些属于 `apps/frontend`。
- `globals.css` 的 `@source` 相对于样式表解析：`../../../../apps/frontend/src/**/*.{ts,tsx}` 与 `../**/*.{ts,tsx}`；改了前端目录要同步。
- 颜色用语义 token；不要在组件里写死 `bg-blue-500` 之类的原始颜色。
- `cn` 来自 `cn` 包，不要再引入 `clsx` + `tailwind-merge`；`src/lib/utils.ts` 只做 re-export。
- 不引入 `dist` / 构建脚本；Next 通过 `transpilePackages: ["@workspace/ui"]` 直接编译源码。
- `hooks/` 目录按需创建；`exports` 里已预留 `./hooks/*`。

## Storybook

- 命令：`pnpm --filter @workspace/ui storybook`（6006）、`pnpm --filter @workspace/ui build-storybook`。
- story 放 `stories/`，不要放回 `src/`；`src/` 只保留会被 app 引用的发布源码。
- 用 CSF 3：`Meta` / `StoryObj` / `export default meta`。export 标识符保持英文（`Primary`），展示名与 docs 描述用中文（`name: "主要"`、`parameters.docs.description`）。
- stories 的 Tailwind 扫描由 `.storybook/storybook.css` 的 `@source "../stories/**/*.{ts,tsx}"` 负责；不要把这条塞进 `globals.css`，否则 app 构建也会扫 story。
- MCP 端点 `http://127.0.0.1:6006/mcp`，只在 Storybook dev 运行时可用；工具集为 docs + development，暂不含 `test-run`。
- 测试已接入：`pnpm --filter @workspace/ui test`（`vitest run --coverage`，行覆盖率 ≥ 95%）、`pnpm --filter @workspace/ui test:watch`；测试放 `__tests__/`，`src/` 只留发布源码。
- Lint / format：`pnpm --filter @workspace/ui lint` / `format`，配置用根 `.oxlintrc.json` / `.oxfmtrc.json`；Next.js 规则不适用于本包，已在配置里 override。
- 仍不引入 `@storybook/addon-vitest`、Playwright；MCP 工具集保持 docs + development。

## 测试

- 配置：`vitest.config.ts` 继承 `@workspace/vitest-config/react`，`plugins: [react()]`，路径别名用 Vite 8 原生 `resolve.tsconfigPaths`。
- 目录：`__tests__/**/*.test.tsx`；setup 在 `__tests__/setup.ts`（引入 jest-dom 并显式 `afterEach(cleanup)`）。
- 覆盖率：只卡行覆盖率 95%，`coverage.include` 覆盖 `src` 下全部 ts/tsx；报告在 `coverage/`。
- 组件测试直接 import `@workspace/ui/components/*`，走包 `exports` 或 tsconfig paths，不要复制组件到测试目录。

## 改动前读什么

- shadcn 安装与 alias：[../../apps/frontend/CLAUDE.md](../../apps/frontend/CLAUDE.md)
- 样式与组件规则：[../../.claude/skills/shadcn/rules/](../../.claude/skills/shadcn/rules/)（styling、composition、forms、icons）
- 文档同步：[../../.claude/rules/doc-sync.md](../../.claude/rules/doc-sync.md)
- 注释规则：[../../.claude/rules/code-comments.md](../../.claude/rules/code-comments.md)

## 验证

- `pnpm --filter frontend build` 退出码 0（本包没有独立 build 脚本）。
- `pnpm --filter @workspace/ui test` 用例通过，行覆盖率 ≥ 95%；`check-types` 退出码 0。
- 新增组件后，从 `apps/frontend` 的页面 import 一次，确认路径与类型解析正常。
- 改 story 或样式后：6006 页面正常渲染，明暗主题可切换；`build-storybook` 退出码 0。
- MCP 改动后：`tools/list` 含 `docs-list` / `docs-show` / `stories-preview`，不含 `test-run`。
