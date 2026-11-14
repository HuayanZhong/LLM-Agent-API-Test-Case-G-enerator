# packages/ui

共享 UI 包：`@workspace/ui`，承载 shadcn 组件、`cn()` 与 Tailwind v4 全局样式。

## 职责

- 提供可复用的 UI 组件与主题变量，供 `apps/frontend` 引用。
- 只发源码，不构建 `dist`；由 Next 的 `transpilePackages` 转译。
- 组件通过 shadcn CLI 安装，保持 registry 原样，便于后续更新。

## 目录

```text
packages/ui/
+-- .storybook/
|   +-- main.ts            # React + Vite、addons、componentsManifest
|   +-- preview.tsx        # 导入 storybook.css、明暗主题
|   +-- storybook.css      # globals.css + stories 的 @source
+-- stories/
|   +-- button.stories.tsx # 组件展示与交互示例
|   +-- card.stories.tsx
+-- src/
|   +-- components/        # button.tsx、card.tsx 等
|   +-- lib/utils.ts       # cn()，re-export 自 cn 包
|   +-- hooks/             # 按需创建；exports 已预留
|   +-- styles/globals.css # Tailwind v4 入口、主题变量、@source
+-- components.json        # shadcn 配置：aliases 全部指向 @workspace/ui/*
+-- postcss.config.mjs     # @tailwindcss/postcss
+-- package.json           # exports 映射与 Storybook 脚本
```

## 使用

在仓库根目录执行，UI 组件会写入本包：

```bash
pnpm dlx shadcn@latest add <component> -c apps/frontend
```

在代码中引用：

```tsx
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import "@workspace/ui/globals.css"
```

## Storybook

```bash
pnpm --filter @workspace/ui storybook        # http://127.0.0.1:6006
pnpm --filter @workspace/ui build-storybook  # 静态产物 storybook-static/
pnpm --filter @workspace/ui lint             # oxlint .，根配置
pnpm --filter @workspace/ui format           # oxfmt --check .，根配置
```

- Storybook 10.6 使用 `@storybook/react-vite`，只读源码，不额外构建 UI 包。
- story 放在 `stories/`，与发布源码 `src/` 分离；Tailwind 扫描由 `.storybook/storybook.css` 的 `@source` 负责。
- story 的 export 标识符保持英文（如 `Primary`），展示名与 docs 描述用中文（`name: "主要"`）。
- MCP 服务随 Storybook dev 启动，端点为 `http://127.0.0.1:6006/mcp`；仅 dev 运行时可连，工具集是 docs + development，暂不含 `test-run`。

## 依赖与边界

- 依赖走 `frontend` catalog；Storybook 相关走 `storybook` catalog；`shadcn` 走 `tooling`。
- 不放页面、路由、业务组件；这些属于 `apps/frontend`。
- `exports` 与 `src` 目录结构必须同步；新增顶层目录时补 export。`stories/` 不对外导出。
- 当前没有独立构建；测试与 lint / format 已接入，Storybook 只承担预览、文档与 MCP。

## 相关文档

- 包级 AI 规则：[CLAUDE.md](CLAUDE.md)
- 跨工具入口：[AGENTS.md](AGENTS.md)
- 前端：[../../apps/frontend/README.md](../../apps/frontend/README.md)
- 项目总览：[../../README.md](../../README.md)
