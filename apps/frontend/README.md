# apps/frontend

桌面端前端骨架：Next.js 16（App Router）+ React 19 + Tailwind v4 + shadcn/ui。

## 职责

- 承载页面、布局与 app 级 block（如登录表单）。
- 通过 `@workspace/ui` 引用共享组件与全局样式。
- 开发态监听 3000，`pnpm dev` 时与 BFF（4000）、backend（5000）一起启动；生产态由 `apps/desktop` 托管静态导出。

## 运行

在仓库根目录执行：

```bash
pnpm --filter frontend dev     # next dev -p 3000
pnpm --filter frontend build   # next build，产出 out/
pnpm --filter frontend lint    # oxlint .，根配置
pnpm --filter frontend format  # oxfmt --check .，根配置
```

`build` 使用 `output: "export"`，产物是 `apps/frontend/out/` 静态文件；`next start` 与静态导出不兼容，已从脚本移除。生产桌面端由 `apps/desktop` 通过 `app://` 协议加载这些文件。

Next 原生加载 `apps/frontend/.env.development` / `.env.production`；只有 `NEXT_PUBLIC_` 前缀会进入浏览器。变量声明以根 `.env.example` 为准，真实值不要提交。

## 目录

```text
apps/frontend/
+-- .env.development         # 开发值，Next 自动加载（gitignored）
+-- .env.production          # 生产构建值，Next 自动加载（gitignored）
+-- src/
|   +-- app/                 # App Router：layout.tsx、page.tsx、favicon.ico
|   +-- components/          # app 级组件；shadcn 的 block 会落到这里
+-- components.json          # shadcn 配置：ui 指向 @workspace/ui
+-- next.config.ts           # output: "export"；transpilePackages: ["@workspace/ui"]
+-- out/                     # next build 的静态导出产物（gitignored）
+-- postcss.config.mjs       # re-export @workspace/ui/postcss.config
+-- tsconfig.json            # @/* -> ./src/*；@workspace/ui/* -> ../../packages/ui/src/*
+-- AGENTS.md                # 索引 + Next 16 托管块
```

## 依赖与边界

- 依赖版本统一走 `pnpm-workspace.yaml` 的 `frontend` catalog；`typescript`、`@types/node` 走 `tooling`。
- UI 组件、`cn()` 与 Tailwind 主题都在 `packages/ui`，本包不放 `components/ui`。
- 新增 shadcn 组件必须在仓库根执行 `pnpm dlx shadcn@latest add <component> -c apps/frontend`。
- 静态导出不支持 SSR、动态 Route Handler、Server Actions、cookies、rewrites / redirects / headers、proxy、ISR、默认图片优化与无 `generateStaticParams` 的动态路由；需要这些能力时应先和桌面托管方案一起评估。
- 测试与 lint / format 已接入；Electron 桌面壳在 `apps/desktop`，本包不直接依赖 Electron。

## 相关文档

- 包级 AI 规则：[CLAUDE.md](CLAUDE.md)
- 跨工具入口：[AGENTS.md](AGENTS.md)
- 项目总览：[../../README.md](../../README.md)
- 共享 UI 包：[../../packages/ui/README.md](../../packages/ui/README.md)
