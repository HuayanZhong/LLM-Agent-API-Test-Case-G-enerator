# apps/frontend

桌面端前端骨架：Next.js 16（App Router）+ React 19 + Tailwind v4 + shadcn/ui。

## 职责

- 承载页面、布局与 app 级 block：当前 `/` 客户端跳转 `/login/`；`/login/` 与 `/register/` 共用认证布局，只做邮箱 / 密码 / 验证码的前端校验与 Toast 反馈，不接后端。
- 界面支持中英双语：文案来自 `@workspace/i18n`；语言与主题切换位于全局窗口标题栏，排在系统窗口按钮左侧；语言偏好保存在本地存储，URL 不变。
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
|   |       +-- _components/ # 认证私有组件：brand/（品牌栏与标识）、forms/（登录/注册表单）、fields/（输入字段）
|   |       +-- _hooks/      # 记住邮箱、校验错误文案
|   |       +-- _lib/        # 常量与校验
|   +-- components/
|   |   +-- layout/          # 布局级：theme-provider、locale-provider、click-spark-provider、app-titlebar
|   |   +-- controls/        # 可交互控件：theme-toggle、locale-toggle
|   +-- i18n.d.ts            # next-intl 的 AppConfig 类型扩充
|   +-- types/global.d.ts    # 前端侧 Window.desktop（可选，契约来自 @workspace/types）
|   +-- lib/                 # 全局纯逻辑：spark-color.ts（主题令牌 → rgb 色值）
+-- components.json          # shadcn 配置：ui 指向 @workspace/ui；registries 含 @react-bits
+-- next.config.ts           # output: "export"；transpilePackages: ["@workspace/ui", "@workspace/i18n"]
+-- out/                     # next build 的静态导出产物（gitignored）
+-- postcss.config.mjs       # re-export @workspace/ui/postcss.config
+-- tsconfig.json            # @/* -> ./src/*；@workspace/ui/* -> ../../packages/ui/src/*
+-- AGENTS.md                # 索引 + Next 16 托管块
```

## 依赖与边界

- 依赖版本统一走 `pnpm-workspace.yaml` 的 `frontend` catalog；`typescript`、`@types/node` 走 `tooling`；国际化使用 `next-intl`，文案与语言配置来自 `@workspace/i18n`。桌面桥接类型来自 `@workspace/types`（devDependency，只用 `import type`），浏览器预览下 `Window.desktop` 不存在。
- 用户可见文案只能来自 `@workspace/i18n`，组件里不再写中文或英文字面量；校验函数返回错误键，由展示层用 `t()` 解析。
- 语言切换是纯客户端行为：不启用 `[locale]` 路由、middleware 或 proxy，URL 与静态导出路径保持不变；偏好存 `interface-test-agent:locale`。
- UI 组件、`cn()` 与 Tailwind 主题都在 `packages/ui`，本包不放 `components/ui`。
- 新增 shadcn 组件必须在仓库根执行 `pnpm dlx shadcn@latest add <component> -c apps/frontend`。
- 静态导出不支持 SSR、动态 Route Handler、Server Actions、cookies、rewrites / redirects / headers、proxy、ISR、默认图片优化与无 `generateStaticParams` 的动态路由；需要这些能力时应先和桌面托管方案一起评估。
- 登录 / 注册页是纯客户端演示：只做邮箱格式、密码长度、6 位验证码校验、本地邮箱记忆和 Toast 提示；验证码使用 shadcn `InputOTP`；不调用 Supabase / BFF / backend，不伪造认证结果，也不创建 `/workspace` 路由。
- 认证私有代码放在 `src/app/(auth)/_components/{brand,forms,fields}`、`_hooks`、`_lib`；路由组与下划线前缀目录都不参与 URL。跨页面复用的组件才放 `src/components`，并按 `layout/` 与 `controls/` 分层。
- 语言与主题入口由全局标题栏 `src/components/layout/app-titlebar.tsx` 提供：固定在窗口顶部、透明融入背景、不显示标题或图标，右侧为系统窗口按钮留位；控件容器取消拖拽，保证可点击。`ThemeProvider` 不再注册全局键盘快捷键。
- 全局点击火花：根 layout 挂 `ClickSparkProvider`（`src/components/layout/click-spark-provider.tsx`），组件本体是 CLI 拉入的 `@workspace/ui/components/click-spark`（canvas 渲染）。火花颜色经 `src/lib/spark-color.ts` 把 `--primary` / `--foreground` 令牌解析成 rgb 色值并随主题切换跟随；默认参数在适配层集中定义（sparkCount=9、duration=350、spring 缓动、star 形等），调用方可整体覆盖。
- 测试在 `__tests__/`，覆盖登录、注册、验证码冷却、记住邮箱、主题切换、语言切换与持久化、标题栏、布局与根路径跳转；组件测试用 `test-utils` 的 `renderWithIntl` 提供文案上下文。Electron 桌面壳在 `apps/desktop`，本包不直接依赖 Electron。

## 相关文档

- 包级 AI 规则：[CLAUDE.md](CLAUDE.md)
- 跨工具入口：[AGENTS.md](AGENTS.md)
- 项目总览：[../../README.md](../../README.md)
- 共享 UI 包：[../../packages/ui/README.md](../../packages/ui/README.md)
- 共享文案包：[../../packages/i18n/README.md](../../packages/i18n/README.md)
