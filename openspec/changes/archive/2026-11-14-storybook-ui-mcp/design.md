# Design

## Context

见 `proposal.md` 的 Why。当前约束：

- `packages/ui` 是源码包：无 `dist`、无构建脚本，`exports` 指向 `src/*`；由 Next 的 `transpilePackages` 转译。
- 样式入口 `src/styles/globals.css` 使用 Tailwind v4，`@source "../**/*.{ts,tsx}"` 已覆盖 `src/**`。
- 包内已有 `postcss.config.mjs`（`@tailwindcss/postcss`），可被 Vite 复用。
- 依赖统一走 `pnpm-workspace.yaml` 的 catalog；根 `pnpm dev` 由 Turbo 拉起所有带 `dev` 脚本的工作区。
- 用户明确要求暂不引入 Vitest / Playwright，测试栈后续统一。
- Storybook 10.6.7 的官方 React+Vite 模板仍使用 CSF 3（`Meta` / `StoryObj` / `export default meta`），不是 11 beta 的 CSF 4。

## Goals / Non-Goals

**Goals:**

- 在 `packages/ui` 内独立运行 Storybook（6006），不改根 `pnpm dev` 的启动集合。
- 组件 props 与 story 能通过 MCP 暴露给 agent（docs + development 工具集）。
- 样式、明暗主题与 Next 应用保持一致。
- 依赖版本集中到 catalog，脚本可直接跑。

**Non-Goals:**

- 不接入 Storybook Test（`@storybook/addon-vitest` + Vitest + Playwright）。
- 不把 Storybook 放进 `apps/frontend` 或新开 `apps/storybook`。
- 不做视觉回归、测试覆盖率、CI。
- 不改 `Button` / `Card` 的实现，只加 story。
- 不启用 MCP 的 `test-run`；该工具等测试栈落地后再开。

## Decisions

### D1. Storybook 放在 `packages/ui`

```text
packages/ui/
+-- .storybook/
|   +-- main.ts
|   +-- preview.tsx
|   +-- storybook.css      # import globals.css + 注册 stories/ 扫描路径
+-- stories/
|   +-- button.stories.tsx
|   +-- card.stories.tsx
+-- src/components/
|   +-- button.tsx
|   +-- card.tsx
+-- package.json   # storybook / build-storybook
```

理由：样式入口、PostCSS 配置、组件与 `components.json` 都在同一包内，Storybook 不需要跨包拼装。story 放独立的 `stories/`，让 `src/` 只保留会被 app 引用的发布源码；stories 的 Tailwind 扫描由 `.storybook/storybook.css` 单独注册。

备选：story 与组件同目录。Tailwind 扫描更省事，但会污染 `src/`，且 app 构建也会扫到 story；否决。

### D2. 使用 `@storybook/react-vite`，不用 `nextjs-vite`

理由：组件是纯 React + Radix，不依赖 `next/image`、`next/navigation`；Vite builder 更快，配置更少，也避免把 Next 的构建链引入 UI 包。

备选：`@storybook/nextjs-vite`。只有在需要 Next 运行时特性时才值得，当前不需要。

### D3. MCP 只开 docs + development，暂不开 testing

安装 `@storybook/addon-mcp`，在 `main.ts` 打开 `features.componentsManifest`。`@storybook/addon-vitest` 是 addon-mcp 的 **optional peer**，不装；因此 `test-run` 不可用，但 `docs-list` / `docs-show` / `stories-preview` 等可用。

理由：与“Vitest 后续统一”的决定一致。等测试栈落地后，再补 `addon-vitest` + Vitest + `@vitest/browser-playwright`，即可打开 `test-run`。

### D4. CSF 3 写法

Storybook 10.6.7 的模板仍是：

```ts
import type { Meta, StoryObj } from "@storybook/react-vite"
const meta = { title, component, ... } satisfies Meta<typeof Button>
export default meta
type Story = StoryObj<typeof meta>
export const Primary: Story = { args: { ... } }
```

11 beta 才转向 `preview.meta()` / `meta.story()`。本次按已安装版本写 CSF 3，避免混用。

### D5. 样式与主题

`.storybook/preview.tsx` 导入 `.storybook/storybook.css`，后者负责两件事：

```css
@import "../src/styles/globals.css";

/* stories 在 src 之外，单独注册扫描路径；app 构建不会读到这里 */
@source "../stories/**/*.{ts,tsx}";
```

主题用 `withThemeByClassName` 接入：

```tsx
import "./storybook.css"
import { withThemeByClassName } from "@storybook/addon-themes"

const preview: Preview = {
  decorators: [
    withThemeByClassName({ themes: { light: "", dark: "dark" }, defaultTheme: "light" }),
  ],
}
```

`globals.css` 的 `@source` 覆盖 `src/**`；`stories/` 不在其内，所以由 `storybook.css` 追加一条相对 `.storybook` 的 `@source`。这样 app 的 Next 构建不会扫到 story，Storybook 又能拿到 story 里用到的 utility。

PostCSS 优先复用 `packages/ui/postcss.config.mjs`。若 Storybook 的 Vite 没有自动加载，补一份 `.storybook/postcss.config.mjs` re-export 同一配置；以 6006 页面实际样式为准。

### D6. 依赖与 catalog

新增 `storybook` catalog：

```yaml
storybook:
  storybook: ^10.6.7
  "@storybook/react-vite": ^10.6.7
  "@storybook/addon-docs": ^10.6.7
  "@storybook/addon-a11y": ^10.6.7
  "@storybook/addon-themes": ^10.6.7
  "@storybook/addon-mcp": ^10.6.7
  vite: ^8.3.8
```

`packages/ui` 的 devDependencies 全部用 `catalog:storybook`。不新增 `vitest`、`playwright`。

### D7. 脚本与端口

```json
"storybook": "storybook dev -p 6006",
"build-storybook": "storybook build"
```

脚本名不用 `dev`，根 `pnpm dev` 不会把 Storybook 拉起。运行方式：

```bash
pnpm --filter @workspace/ui storybook
pnpm --filter @workspace/ui build-storybook
```

### D8. MCP 接入

`.mcp.json` 增加：

```json
"storybook": {
  "type": "http",
  "url": "http://localhost:6006/mcp"
}
```

约束：只有 Storybook dev 在跑时可用；端口被占用时同步改 URL。不把 `test-run` 写进文档，等测试栈落地后再加。

### D9. story 范围

- `button.stories.tsx`：Primary / Secondary / Outline / Ghost / Destructive，至少覆盖 `size` 与 `disabled`。
- `card.stories.tsx`：一个完整的 `CardHeader` + `CardTitle` + `CardDescription` + `CardContent` + `CardFooter` 组合。
- 每个 story 带 `tags: ["autodocs"]`，让 docs 工具集能读到 props。

### D10. 文档更新

- `packages/ui/README.md`：新增「Storybook」小节（命令、6006、MCP）。
- `packages/ui/CLAUDE.md`：新增本地规则：story 与组件同目录、CSF 3、不要改 `globals.css` 的 `@source`、MCP 只在 dev 时可用。
- `packages/ui/AGENTS.md`：索引补 Storybook / MCP。
- 根 `README.md` 端口表补 6006；根 `CLAUDE.md` 的包级文档条目补 Storybook；根 `AGENTS.md` 的索引补 MCP 入口。

## Risks / Trade-offs

- [Tailwind v4 在 Storybook 中不生效] → 先复用 `postcss.config.mjs`；无效则加 `.storybook/postcss.config.mjs`，以 6006 实际渲染为准。
- [story 在 `src` 内会被 Next 的 Tailwind 扫描，增加少量生产 CSS] → 可接受；story 类名通常与组件重合。
- [MCP 是 preview，API 可能变] → 只依赖 docs + development 工具集；文档注明 preview。
- [addon-mcp 的 optional peer `addon-vitest` 未安装] → pnpm 不应报错；若出现 peer 警告，记录并确认 `test-run` 不在 tools/list。
- [6006 被占用] → 脚本允许传 `-p`；文档说明改端口时同步 `.mcp.json`。
- [Storybook 10.6 与 Vite 8 组合未在本仓库验证] → 安装后立即跑 `storybook dev` 与 `build-storybook`；失败则降到 Vite 7。
- [CSF 版本混用] → 统一 CSF 3，不引入 11 beta 的 `defineMain` / `preview.meta`。

## Migration Plan

1. 加 `storybook` catalog 与 `packages/ui` 依赖、脚本，`pnpm install`。
2. 写 `.storybook/main.ts`、`preview.tsx`，启动 6006。
3. 验证 Tailwind 与明暗主题；必要时补 PostCSS 配置。
4. 加 Button / Card story，确认侧栏与渲染。
5. 验证 `/mcp` 的 `tools/list`、`docs-list`，确认 `test-run` 不在列表。
6. `build-storybook` 生成静态产物。
7. 更新 `.mcp.json` 与三份包级文档、根索引。

回滚：删除 `.storybook/`、两个 story、`packages/ui` 的 Storybook 依赖与脚本、`storybook` catalog、`.mcp.json` 的 storybook 条目，还原文档。无运行时状态需要迁移。
