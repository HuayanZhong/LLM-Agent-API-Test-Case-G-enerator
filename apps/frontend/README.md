# apps/frontend

桌面端前端骨架：Next.js 16（App Router）+ React 19 + Tailwind v4 + shadcn/ui。

## 职责

- 承载页面、布局与 app 级 block：当前 `/` 客户端跳转 `/login/`；`/login/` 与 `/register/` 共用认证布局，只做邮箱 / 密码 / 验证码的前端校验与 Toast 反馈，不接后端。
- 通过 `@workspace/ui` 引用共享组件与全局样式，表单级提示使用 `sonner` Toast。
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
|   +-- app/                 # App Router：layout.tsx、page.tsx（跳转 /login/）、(auth)/
|   |   +-- (auth)/          # 认证路由组：layout.tsx、login/page.tsx、register/page.tsx
|   |       +-- _components/ # 登录/注册表单、字段、品牌栏（下划线目录不参与路由）
|   |       +-- _hooks/      # 记住邮箱
|   |       +-- _lib/        # 常量与校验
|   +-- components/          # 全局 app 级组件：theme-provider.tsx、theme-toggle.tsx、click-spark-provider.tsx
|   +-- lib/                 # 全局纯逻辑：spark-color.ts（主题令牌 → rgb 色值）
+-- components.json          # shadcn 配置：ui 指向 @workspace/ui；registries 含 @react-bits
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
- 登录 / 注册页是纯客户端演示：只做邮箱格式、密码长度、6 位验证码校验、本地邮箱记忆和 Toast 提示；验证码使用 shadcn `InputOTP`；不调用 Supabase / BFF / backend，不伪造认证结果，也不创建 `/workspace` 路由。
- 认证私有代码放在 `src/app/(auth)/_components`、`_hooks`、`_lib`；路由组与下划线前缀目录都不参与 URL。跨页面复用的组件才放 `src/components`。
- 主题切换按钮固定在认证布局右上角，`ThemeProvider` 不再注册全局键盘快捷键。
- 全局点击火花：根 layout 挂 `ClickSparkProvider`（`src/components/click-spark-provider.tsx`），组件本体是 CLI 拉入的 `@workspace/ui/components/click-spark`（canvas 渲染）。火花颜色经 `src/lib/spark-color.ts` 把 `--primary` / `--foreground` 令牌解析成 rgb 色值并随主题切换跟随；默认参数在适配层集中定义（sparkCount=9、duration=350、spring 缓动、star 形等），调用方可整体覆盖。
- 测试在 `__tests__/`，覆盖登录、注册、验证码冷却、记住邮箱、主题切换、布局与根路径跳转；Electron 桌面壳在 `apps/desktop`，本包不直接依赖 Electron。

## 相关文档

- 包级 AI 规则：[CLAUDE.md](CLAUDE.md)
- 跨工具入口：[AGENTS.md](AGENTS.md)
- 项目总览：[../../README.md](../../README.md)
- 共享 UI 包：[../../packages/ui/README.md](../../packages/ui/README.md)
