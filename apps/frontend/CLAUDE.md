# CLAUDE.md

本文件是 `apps/frontend` 的包级规则。项目级规则见 [../../CLAUDE.md](../../CLAUDE.md)。

## 本包职责

Next.js 16 App Router 前端骨架：页面、布局、app 级 block。共享 UI 与样式在 `packages/ui`。

## 命令与端口

```bash
pnpm --filter frontend dev     # 3000
pnpm --filter frontend build
pnpm --filter frontend test    # vitest run --coverage，行覆盖率 ≥ 95%
pnpm --filter frontend test:watch
pnpm --filter frontend lint    # oxlint .，根配置
pnpm --filter frontend format  # oxfmt --check .，根配置
pnpm --filter frontend start
```

## 目录与入口

- 页面：`src/app/layout.tsx`、`src/app/page.tsx`。
- app 级组件：`src/components/`；`@/*` 指向 `./src/*`。
- 测试：`__tests__/**/*.test.tsx`（Next 官方 Vitest 指南的 `__tests__` 约定），setup 在 `__tests__/setup.ts`。
- 共享组件：`@workspace/ui/components/*`；`cn()` 在 `@workspace/ui/lib/utils`。

## 本包约束

- 新增 shadcn 组件时在仓库根执行 `pnpm dlx shadcn@latest add <component> -c apps/frontend`；UI 组件会写入 `packages/ui`，不要手动放到本包。
- `components.json` 的 `ui` / `utils` 必须保持指向 `@workspace/ui`；改 alias 会让 `add` 落错位置。
- `next.config.ts` 的 `transpilePackages: ["@workspace/ui"]` 不能删；UI 包只发源码。
- 不要在 `src/app` 里直接改主题色；颜色用语义 token（`bg-background`、`text-muted-foreground` 等），主题变量在 `packages/ui/src/styles/globals.css`。
- 不使用 `next/font/google`；字体栈在 `globals.css` 的 `@theme inline` 里，避免构建时访问 Google Fonts。
- `AGENTS.md` 的 `<!-- BEGIN:nextjs-agent-rules -->` 块由 `next dev` 重写；我们的内容放在标记上方，不要编辑标记内部。
- `next-env.d.ts` 由 Next 生成，不要手改。
- 环境变量：`apps/frontend/.env.development` / `.env.production` 由 Next 原生加载，放 `NEXT_PUBLIC_*`；变量声明见根 `.env.example`，不要提交真实值。
- 测试配置继承 `@workspace/vitest-config/react`，用 `@vitejs/plugin-react` + Vite 8 原生 `resolve.tsconfigPaths`；`setupFiles` 指向 `__tests__/setup.ts`。
- 覆盖率只卡行覆盖率 95%；`src/app/layout.tsx` 是 Next 根布局（html/body/metadata），已在 `coverage.exclude` 中排除。
- Lint / format 用根 `.oxlintrc.json` / `.oxfmtrc.json`，本包只提供 `lint` / `format` 脚本；Next.js 规则只在本包生效，`packages/ui` 另有 override。
- Vitest 不支持 async Server Components；遇到 `async` 页面用 e2e，不要在 `__tests__` 里强行渲染。
- Electron 壳尚未接入；不要假设存在主进程或 IPC。

## 改动前读什么

- 端口与全局命令：[../../README.md](../../README.md)
- shadcn 安装方式：[../../packages/ui/CLAUDE.md](../../packages/ui/CLAUDE.md)
- 文档同步要求：[../../.claude/rules/doc-sync.md](../../.claude/rules/doc-sync.md)
- 注释规则：[../../.claude/rules/code-comments.md](../../.claude/rules/code-comments.md)

## 验证

- `pnpm --filter frontend dev` 后访问 `http://localhost:3000`，页面与组件正常渲染。
- 改样式后确认 `.next` 产出的 CSS 同时包含 app 侧与 ui 侧类名。
- `pnpm --filter frontend test` 用例通过，行覆盖率 ≥ 95%。
- `pnpm --filter frontend check-types` 与 `pnpm --filter frontend build` 退出码 0。
