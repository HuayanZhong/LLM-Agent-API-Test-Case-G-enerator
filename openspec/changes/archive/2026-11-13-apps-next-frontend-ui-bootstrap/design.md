# Design

## Context

见 `proposal.md` 的 Why。当前约束：

- pnpm 12 monorepo，`apps/*` 与 `packages/*` 已在 workspace 内；根 `dev` 由 Turbo 并行调度，只有 `dev` 任务。
- `apps/backend`、`apps/bff` 是 NestJS 12 + ESM 骨架，依赖走 `catalog:backend`。
- 根 `.env.example` 保持为空；前端骨架不引入真实密钥。
- 暂不接 ESLint / Prettier / Vitest，也不建 `packages/typescript-config`。
- shadcn CLI 4.23.0；官方 `next-monorepo` 模板的 app 侧不带 `src/`，`packages/ui` 带 `src/`。

## Goals / Non-Goals

**Goals:**

- 一套可运行的 Next 骨架：3000 端口，`pnpm dev` 与两个 Nest 服务一起启动。
- shadcn 组件与依赖只落在 `packages/ui`；app 只放页面和 block。
- 依赖版本集中到 catalog，后续新增组件不需要逐包对版本。
- 目录形状对称：`apps/frontend/src/*` 与 `packages/ui/src/*`。

**Non-Goals:**

- Electron 壳、安装包、自动更新。
- 业务页面、BFF 调用、鉴权。
- 测试、lint、格式化、CI。
- `packages/ui` 的独立构建产物（不做 `dist`，由 Next 转译源码）。

## Decisions

### D1. 用官方模板生成后裁剪，而不是手写

在仓库外临时目录执行：

```bash
pnpm dlx shadcn@latest init --monorepo -t next -n scratch -b radix -p nova -y
```

只取 `apps/web` 与 `packages/ui`，改名/移位后接入现有 workspace。

理由：`components.json`、`exports`、`postcss.config.mjs`、`transpilePackages`、主题变量之间有一组隐式契约；模板能保证与 CLI 4.23.0 的预期一致。手写容易漏 `exports` 或 alias，`add` 时才暴露。

备选：`create-next-app` + 手写 `packages/ui`。文件更少，但 CLI 的 monorepo 路由需要自己拼，风险更高。

### D2. app 侧使用 `src/`

```text
apps/frontend/src/app/{layout,page}.tsx
apps/frontend/src/components/theme-provider.tsx
```

理由：与 `packages/ui/src` 对称；Next 配置留在 app 根目录。shadcn CLI 会检测 `isSrcDir`，通过 `tsconfig.json` 的 `@/* -> ./src/*` 解析 alias，行为不变。

备选：跟随官方模板把 `app/` 放根目录。少一层路径，但两个 workspace 形状不一致。

### D3. `radix-nova`，不用 Base UI

理由：官方 monorepo 模板就是 `radix-nova`；教程、block、第三方 registry 绝大多数是 `asChild` 写法，毕设查资料成本最低。shadcn 4.x 已统一到 `radix-ui` 包，依赖数量可控。

备选：`base`（Base UI），`render={<Button />}` 写法，更新但可参考示例少。`components.json` 的 base 初始化后不能改，所以现在定死。

### D4. 两个 `components.json`，`add` 在 app 目录执行

- `apps/frontend/components.json`：`ui` / `utils` 指向 `@workspace/ui/*`，`components` / `hooks` / `lib` 指向 `@/*`。
- `packages/ui/components.json`：全部指向 `@workspace/ui/*`。
- `apps/frontend/package.json` 依赖 `"@workspace/ui": "workspace:*"`。
- `packages/ui/package.json` 提供 `exports`：`./globals.css`、`./postcss.config`、`./components/*`、`./lib/*`、`./hooks/*`。

CLI 解析链：app `components.json` → `@workspace/ui` 包 → ui `components.json`，因此 UI 组件、依赖、CSS 变量都落在 ui 包；block 的表单落在 `apps/frontend/src/components`。

约束：两个 `components.json` 必须同时存在，否则 `add` 报 `Could not load the workspace config`。

### D5. Tailwind v4 样式入口放 `packages/ui`

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";

@source "../../../../apps/frontend/src/**/*.{ts,tsx}";
@source "../**/*.{ts,tsx}";
```

- `@source` 相对样式表路径解析。官方模板的 `../../../apps` 从 `packages/ui/src/styles` 起算会落到 `packages/apps`，少一级，这里改为四级并只扫 `apps/frontend/src`。
- `shadcn/tailwind.css` 由 `shadcn` devDependency 提供，包含 `@custom-variant` 与动画；不是只给 CLI 用。
- 主题变量由 `init` 写入同一文件，后续 `add` 继续改这里。

### D6. Catalog 划分

- 新增 `frontend` catalog：`next`、`react`、`react-dom`、`next-themes`、`tailwindcss`、`@tailwindcss/postcss`、`@types/react`、`@types/react-dom`、`lucide-react`、`class-variance-authority`、`cn`、`radix-ui`、`tw-animate-css`。
- `typescript`、`@types/node` 从 `backend` 移到 `tooling`；backend / bff 改引用 `catalog:tooling`。
- `shadcn` 放 `tooling`。

理由：同一个版本只声明一次；TypeScript 是全仓库工具，不属于某个后端。shadcn 4.x 用 `cn` + `radix-ui`，不再用 `clsx` + `tailwind-merge` + 单个 `@radix-ui/react-*`。

### D7. 字体用系统栈

去掉模板的 `next/font/google`，在 `globals.css` 定义：

```css
--font-sans: "Segoe UI", "Microsoft YaHei", ui-sans-serif, system-ui, sans-serif;
--font-mono: "Cascadia Code", Consolas, ui-monospace, monospace;
```

理由：`next/font/google` 首次构建需要访问 Google Fonts，国内网络容易失败。系统栈离线可用，代价是失去 Geist 的视觉细节。

### D8. 不建共享 tsconfig / eslint 包

两个 tsconfig 各自内联必要选项，app 保留 `@/*` 与 `@workspace/ui/*` paths，ui 保留 `@workspace/ui/* -> ./src/*`。

理由：与你之前“先不配置 tsconfig.base.json、后面统一”的决定一致；避免现在引入 `packages/typescript-config` 又马上重构。

## Risks / Trade-offs

- [Tailwind 扫不到 app 目录] → 用 D5 的四级路径；以 `.next` 产出的 CSS 是否包含 `min-h-svh` 为准，而不是只看源码。
- [`add` 把新依赖写成 `^x.y.z`] → 核心依赖已预声明在 package.json 与 catalog；新组件依赖首次会写直接版本，后续统一转 catalog。
- [Next 16 + React 19.3.1 + TS 6 组合未在本仓库验证] → 安装后立刻跑 `next build`；失败则前端单独降到 TS 5.9.x。
- [pnpm 12 忽略依赖构建脚本] → 出现 `sharp` / `esbuild` 提示时在 `pnpm-workspace.yaml` 加 `allowBuilds`。
- [Next 首次运行改写 tsconfig] → 正常行为，接受它补的 `plugins` 与 include。
- [模板目录与官方文档截图不一致] → 我们多一层 `src/`，以本仓库 README 为准。
- [Electron 尚未接入] → 本轮只保证 `next dev` / `next build` 可跑；打包时再决定 standalone 输出与加载方式。

## Migration Plan

1. 临时目录生成官方模板，复制并裁剪到 `apps/frontend`、`packages/ui`。
2. 改根 catalog、两个 package.json、tsconfig、components.json、globals.css。
3. `pnpm install`，启动 3000 验证页面与样式。
4. 在 `apps/frontend` 执行一次 `add card` 验证落点。
5. 跑 `pnpm dev` 验证 3000 / 4000 / 5000，再跑 `next build`。
6. 同步文档与 OpenSpec context，重新生成技术架构图。

回滚：删除 `apps/frontend`、`packages/ui`，还原 `pnpm-workspace.yaml` 与 backend/bff 的两处 catalog 引用，还原文档。没有数据库或运行时状态需要迁移。
