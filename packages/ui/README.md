# packages/ui

共享 UI 包：`@workspace/ui`，承载 shadcn 组件、`cn()` 与 Tailwind v4 全局样式。

## 职责

- 提供可复用的 UI 组件与主题变量，供 `apps/frontend` 引用。
- 只发源码，不构建 `dist`；由 Next 的 `transpilePackages` 转译。
- 组件通过 shadcn CLI 安装，保持 registry 原样，便于后续更新。

## 目录

```text
packages/ui/
+-- src/
|   +-- components/      # button.tsx、card.tsx 等
|   +-- lib/utils.ts     # cn()，re-export 自 cn 包
|   +-- hooks/           # 按需创建；exports 已预留
|   +-- styles/globals.css # Tailwind v4 入口、主题变量、@source
+-- components.json      # shadcn 配置：aliases 全部指向 @workspace/ui/*
+-- postcss.config.mjs   # @tailwindcss/postcss
+-- package.json         # exports 映射
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

## 依赖与边界

- 依赖走 `frontend` catalog；`shadcn` 走 `tooling`。
- 不放页面、路由、业务组件；这些属于 `apps/frontend`。
- `exports` 与 `src` 目录结构必须同步；新增顶层目录时补 export。
- 当前没有独立构建、测试与 lint。

## 相关文档

- 包级 AI 规则：[CLAUDE.md](CLAUDE.md)
- 跨工具入口：[AGENTS.md](AGENTS.md)
- 前端：[../../apps/frontend/README.md](../../apps/frontend/README.md)
- 项目总览：[../../README.md](../../README.md)
