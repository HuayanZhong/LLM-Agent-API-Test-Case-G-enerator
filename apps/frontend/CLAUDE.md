# CLAUDE.md

本文件是 `apps/frontend` 的包级规则。项目级规则见 [../../CLAUDE.md](../../CLAUDE.md)。

## 本包职责

Next.js 16 App Router 前端骨架：页面、布局、app 级 block 与中英双语界面。共享 UI 与样式在 `packages/ui`，文案与语言配置在 `packages/i18n`。

## 命令与端口

```bash
pnpm --filter frontend dev     # 3000
pnpm --filter frontend build   # next build，产出 out/
pnpm --filter frontend test    # vitest run --coverage，行覆盖率 ≥ 95%
pnpm --filter frontend test:watch
pnpm --filter frontend lint    # oxlint .，根配置
pnpm --filter frontend format  # oxfmt --check .，根配置
```

`next start` 已移除：`output: "export"` 下没有 Next 运行时服务，生产桌面端由 `apps/desktop` 通过 `app://` 托管 `out/`。

## 目录与入口

- 页面：`src/app/layout.tsx`、`src/app/page.tsx`（客户端跳转 `/login/`）、`src/app/(auth)/login/page.tsx`、`src/app/(auth)/register/page.tsx`。
- 认证布局：`src/app/(auth)/layout.tsx`（品牌栏、移动端标识、右上角主题按钮、Toaster）；路由组目录带括号，不进入 URL。
- 认证私有代码：`src/app/(auth)/_components/`（登录/注册表单、字段、品牌栏、产品标记、左栏扫描线背景适配）、`_hooks/use-remembered-email.ts`、`_lib/auth-constants.ts` 与 `validate-auth.ts`；下划线前缀目录不参与路由。
- 全局 app 级组件：`src/components/`（`theme-provider.tsx`、`theme-toggle.tsx`、`locale-provider.tsx`、`locale-toggle.tsx`、`click-spark-provider.tsx`）；全局纯逻辑 `src/lib/spark-color.ts`；`@/*` 指向 `./src/*`。
- 国际化：`src/i18n.d.ts` 给 next-intl 的 `AppConfig` 扩充 `Locale` 与 `Messages`；文案目录与语言配置在 `@workspace/i18n`；`src/components/locale-provider.tsx` 负责偏好读取、`<html lang>`、标题与描述同步，`locale-toggle.tsx` 是右上角的下拉切换入口（使用 `@workspace/ui/components/dropdown-menu`，ui 包 coverage 已排除）。
- 字段文案与错误翻译：`src/app/(auth)/_hooks/use-auth-error-message.ts` 把校验键翻译成当前语言；`_components/product-masthead.tsx` 是左栏与移动端共用的产品标识。
- 全局点击火花：根 layout 的 `ClickSparkProvider` 包住全部页面；组件本体在 `@workspace/ui/components/click-spark`（CLI 拉入、canvas 渲染、jsdom 不可测，ui 包 coverage 已排除），火花颜色由 `src/lib/spark-color.ts` 解析主题令牌并随 `resolvedTheme` 跟随；默认参数集中在适配层，不要把动效调参散进页面。
- 左栏扫描线背景：组件本体在 `@workspace/ui/components/scanner`（ReactBits 自定义 registry 拉入、WebGL 渲染、jsdom 不可测，ui 包 coverage 已排除）；灰度配色、扫掠速度与低透明度集中在 `_components/scanner-backdrop.tsx`，不要在品牌栏里重复调参。
- 测试：`__tests__/**/*.test.{ts,tsx}`（Next 官方 Vitest 指南的 `__tests__` 约定；纯逻辑用 `.test.ts`，组件用 `.test.tsx`），setup 在 `__tests__/setup.ts`。
- 共享组件：`@workspace/ui/components/*`；`cn()` 在 `@workspace/ui/lib/utils`；表单级 Toast 用 `sonner`。

## 本包约束

- 新增 shadcn 组件时在仓库根执行 `pnpm dlx shadcn@latest add <component> -c apps/frontend`；UI 组件会写入 `packages/ui`，不要手动放到本包。
- 登录 / 注册页是纯客户端 UI 演示：只做邮箱格式、密码长度、6 位验证码校验与 Toast 反馈；不接 Supabase / BFF / backend，不伪造认证结果，不创建真实账号；`/workspace` 工作台属于后续变更。
- 认证专属组件、hook、纯函数分别放 `src/app/(auth)/_components`、`_hooks`、`_lib`；不要把这些塞回全局 `src/components` / `src/lib`。
- 认证数值常量（密码长度、验证码长度、演示延时、验证码冷却、邮箱存储键、编号宽度）集中在 `src/app/(auth)/_lib/auth-constants.ts`；不要在组件里写裸数字或 `text-[10px]` 这类任意值类，尺寸优先用 Tailwind 的比例 / 间距 token。
- 记住邮箱只允许把邮箱写入 `interface-test-agent:last-email`，密码不得进入任何本地存储。
- 主题切换只通过页面上的可见按钮（固定在认证布局右上角）；不要在 `ThemeProvider` 或全局监听里恢复键盘快捷键，避免与输入框和桌面快捷键冲突。
- 表单级错误与成功提示用 `sonner` Toast；字段错误仍留在输入框下方，不要退回页面内 Alert 汇总。
- Radix Checkbox 依赖 `ResizeObserver`；`__tests__/setup.ts` 已补 polyfill，新增 Radix 组件时不要删除。
- `components.json` 的 `ui` / `utils` 必须保持指向 `@workspace/ui`；改 alias 会让 `add` 落错位置。
- `next.config.ts` 的 `transpilePackages: ["@workspace/ui", "@workspace/i18n"]` 不能删；两个包只发源码。
- 不要在 `src/app` 里直接改主题色；颜色用语义 token（`bg-background`、`text-muted-foreground` 等），主题变量在 `packages/ui/src/styles/globals.css`。
- 不使用 `next/font/google`；字体栈在 `globals.css` 的 `@theme inline` 里，避免构建时访问 Google Fonts。
- `AGENTS.md` 的 `<!-- BEGIN:nextjs-agent-rules -->` 块由 `next dev` 重写；我们的内容放在标记上方，不要编辑标记内部。
- `next-env.d.ts` 由 Next 生成，不要手改。
- 环境变量：`apps/frontend/.env.development` / `.env.production` 由 Next 原生加载，放 `NEXT_PUBLIC_*`；变量声明见根 `.env.example`，不要提交真实值。
- 测试配置继承 `@workspace/vitest-config/react`，用 `@vitejs/plugin-react` + Vite 8 原生 `resolve.tsconfigPaths`；`setupFiles` 指向 `__tests__/setup.ts`。
- 用户可见文案只能来自 `@workspace/i18n`；组件、Toast、`aria-label` 与 metadata 不得再写中英文字面量。新增文案先在 `zh-CN.json` 定键，再补 `en-US.json`。
- 校验函数只返回错误键（`AuthErrorKey`），不得返回中文或英文句子；插值参数（`min`、`length`、`seconds`）由展示层传给 `t()`。
- 语言切换是纯客户端行为：不启用 `[locale]` 路由、middleware 或 proxy，URL 与静态导出路径不变；偏好键固定 `interface-test-agent:locale`。
- `LocaleProvider` 首帧必须固定 `defaultLocale`，用 `useSyncExternalStore` 对齐本地存储；不要在渲染期或挂载 effect 里同步 setState，否则会 hydration mismatch 或覆盖已保存偏好。
- 组件测试用 `__tests__/test-utils.tsx` 的 `renderWithIntl`；需要切换语言或持久化的用例再用 `LocaleProvider`，并在测试文件内 mock `next/navigation` 的 `usePathname`。
- 覆盖率只卡行覆盖率 95%；`src/app/layout.tsx` 是 Next 根布局（html/body/metadata），已在 `coverage.exclude` 中排除；国际化新增的 Provider、切换组件与文案一致性用例同样计入覆盖率。
- Lint / format 用根 `.oxlintrc.json` / `.oxfmtrc.json`，本包只提供 `lint` / `format` 脚本；Next.js 规则只在本包生效，`packages/ui` 另有 override。
- Vitest 不支持 async Server Components；遇到 `async` 页面用 e2e，不要在 `__tests__` 里强行渲染。
- `next.config.ts` 的 `output: "export"`、`trailingSlash: true`、`images: { unoptimized: true }` 是桌面托管的前提，不要改回服务端模式。
- 静态导出不支持 SSR、动态 Route Handler、Server Actions、cookies、rewrites / redirects / headers、proxy、ISR、默认图片优化与无 `generateStaticParams` 的动态路由；需要这些能力时先走 OpenSpec 变更，不要只在 `next dev` 里验证。
- Electron 桌面壳在 `apps/desktop`；本包不直接 import Electron，页面只通过 HTTP / BFF 或 preload 暴露的接口与宿主交互。

## 改动前读什么

- 端口与全局命令：[../../README.md](../../README.md)
- shadcn 安装方式：[../../packages/ui/CLAUDE.md](../../packages/ui/CLAUDE.md)
- 共享文案包与语言边界：[../../packages/i18n/CLAUDE.md](../../packages/i18n/CLAUDE.md)
- 文档同步要求：[../../.claude/rules/doc-sync.md](../../.claude/rules/doc-sync.md)
- 注释规则：[../../.claude/rules/code-comments.md](../../.claude/rules/code-comments.md)

## 验证

- `pnpm --filter frontend dev` 后访问 `http://localhost:3000`，根路径跳转到 `/login/`；`/login/` 与 `/register/` 在 1024+ 为等宽双栏、768–1023 为窄双栏、<768 为单栏；全局根字号 `clamp(16px, 1vw, 20px)` 在 2560 下把 rem 尺寸放大 1.25 倍，页面无横向溢出。
- 改样式后确认 `.next` 产出的 CSS 同时包含 app 侧与 ui 侧类名。
- `pnpm --filter frontend test` 用例通过，行覆盖率 ≥ 95%；新增语言用例需覆盖切换、持久化、`<html lang>` 与标题同步。
- 语言切换后在浏览器中确认：中英文文案同时变化，表单已填值、记住邮箱与验证码冷却不被重置，URL 不变。
- `pnpm --filter frontend check-types` 与 `pnpm --filter frontend build` 退出码 0，且 `apps/frontend/out/index.html`、`out/login/index.html`、`out/register/index.html`、`out/404.html` 与 `out/_next` 存在。
