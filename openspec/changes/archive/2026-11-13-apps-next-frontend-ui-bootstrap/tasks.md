# Tasks

## 1. 生成并裁剪骨架

- [x] 1.1 在仓库外临时目录执行 `pnpm dlx shadcn@latest init --monorepo -t next -n scratch -b radix -p nova -y`；验证临时目录存在 `apps/web/components.json`、`packages/ui/components.json`、`packages/ui/src/components/button.tsx`。
- [x] 1.2 将 `scratch/apps/web` 复制为 `apps/frontend`、`scratch/packages/ui` 复制为 `packages/ui`，删除两边的 `eslint.config.js`、`tsconfig.lint.json`、`.gitkeep`；验证 `apps/frontend/package.json`、`apps/frontend/components.json`、`packages/ui/package.json` 存在，且上述被删文件不存在。
- [x] 1.3 把 `apps/frontend/app`、`apps/frontend/components` 移到 `apps/frontend/src/` 下；验证 `apps/frontend/src/app/layout.tsx` 与 `apps/frontend/src/components/theme-provider.tsx` 存在，app 根目录不再有 `app/`、`components/`。

## 2. 依赖与 Catalog

- [x] 2.1 在 `pnpm-workspace.yaml` 新增 `frontend` catalog，把 `typescript`、`@types/node` 从 `backend` 移到 `tooling`，并让 `apps/backend`、`apps/bff` 的这两项改引用 `catalog:tooling`；验证 `pnpm install` 退出 0，`pnpm --filter backend build` 与 `pnpm --filter bff build` 均退出 0。
- [x] 2.2 按 design D6 写好 `apps/frontend/package.json` 与 `packages/ui/package.json` 的依赖、scripts、`exports`；验证 `pnpm install` 退出 0，且 `apps/frontend/node_modules/@workspace/ui` 指向 `packages/ui` 的符号链接存在。

## 3. 配置接线

- [x] 3.1 改写 `apps/frontend/tsconfig.json` 为独立配置，`@/*` 指向 `./src/*`，`@workspace/ui/*` 指向 `../../packages/ui/src/*`；验证 `pnpm --filter frontend exec tsc --showConfig` 输出的 `paths` 与预期一致。
- [x] 3.2 改写 `packages/ui/tsconfig.json`，并确认两份 `components.json` 的 `style`、`tailwind.css`、aliases 与 design D4 一致；验证 `pnpm dlx shadcn@latest info -c apps/frontend --json` 报告 framework 为 Next、`isSrcDir` 为 true、`aliases.ui` 为 `@workspace/ui/components`。
- [x] 3.3 修正 `packages/ui/src/styles/globals.css` 的 `@source` 为 `../../../../apps/frontend/src/**/*.{ts,tsx}` 与 `../**/*.{ts,tsx}`，保留 `shadcn/tailwind.css` 与主题变量；确认 `apps/frontend/postcss.config.mjs` re-export `@workspace/ui/postcss.config`，`next.config.ts` 含 `transpilePackages: ["@workspace/ui"]`。
- [x] 3.4 去掉 `apps/frontend/src/app/layout.tsx` 的 `next/font/google`，在 `globals.css` 定义系统字体栈 `--font-sans` / `--font-mono`；验证 `layout.tsx` 不再引用 `Geist`，页面仍由 `ThemeProvider` 包裹。

## 4. 组件路由验证

- [x] 4.1 在仓库根执行 `pnpm dlx shadcn@latest add card -c apps/frontend`；验证 `packages/ui/src/components/card.tsx` 存在，`apps/frontend/src/components` 下没有新增 `card`。
- [x] 4.2 在 `apps/frontend/src/app/page.tsx` 同时引用 `@workspace/ui/components/button` 与 `card` 拼一个最小页面；验证文件中的 import 均指向 `@workspace/ui`。

## 5. 集成验证与文档

- [x] 5.1 启动 `pnpm --filter frontend dev`，验证 `http://localhost:3000` 返回 200，页面显示 Button 与 Card，按 `d` 能切换暗色且控制台无 hydration 警告。
- [x] 5.2 在仓库根启动 `pnpm dev`，验证 3000 返回 HTML、`http://localhost:4000/health` 与 `http://localhost:5000/health` 均返回 `{"status":"ok"}`。
- [x] 5.3 执行 `pnpm --filter frontend build`，验证退出码 0 且 `.next` 产物生成。
- [x] 5.4 检查 3000 页面实际加载的 CSS，验证同时包含 app 侧类（如 `min-h-svh`）与 ui 侧类（如 `bg-primary`），确认 Tailwind 扫描两个目录。
- [x] 5.5 同步 `README.md`、`CLAUDE.md`、`AGENTS.md`、`openspec/config.yaml` 的目录、端口、命令与当前状态；验证 README 中的命令可执行、路径存在，`pnpm exec openspec validate --all` 退出 0。

## 6. 技术架构图

- [x] 6.1 修改 `doc/source/technical-architecture.candidate.json`，把 BFF 归属改为 NestJS，并补上前端 3000 / BFF 4000 / backend 5000 的现状；用新的 `--out-dir` 重新执行 archify finalize，验证退出码 0 且 `doc/technical-architecture.html` 已更新。

## Workflow follow-up

- 完成 review 后用 `openspec-archive-change` 归档，并确认 `openspec list` 中无活跃变更。
