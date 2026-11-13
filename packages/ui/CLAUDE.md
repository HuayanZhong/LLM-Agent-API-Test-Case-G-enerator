# CLAUDE.md

本文件是 `packages/ui` 的包级规则。项目级规则见 [../../CLAUDE.md](../../CLAUDE.md)。

## 本包职责

`@workspace/ui`：shadcn 组件、`cn()`、Tailwind v4 样式与主题变量。只发源码，由 Next 转译。

## 目录与入口

- 组件：`src/components/`；工具：`src/lib/utils.ts`；样式：`src/styles/globals.css`。
- `package.json` 的 `exports` 决定外部可引用的路径；新增顶层目录必须补 export。
- `components.json` 的 aliases 全部指向 `@workspace/ui/*`。

## 本包约束

- 组件只用 CLI 安装：在仓库根执行 `pnpm dlx shadcn@latest add <component> -c apps/frontend`；不要手工新建 `src/components/*` 冒充 registry 组件。
- 不要把页面、路由、业务逻辑放进本包；这些属于 `apps/frontend`。
- `globals.css` 的 `@source` 相对于样式表解析：`../../../../apps/frontend/src/**/*.{ts,tsx}` 与 `../**/*.{ts,tsx}`；改了前端目录要同步。
- 颜色用语义 token；不要在组件里写死 `bg-blue-500` 之类的原始颜色。
- `cn` 来自 `cn` 包，不要再引入 `clsx` + `tailwind-merge`；`src/lib/utils.ts` 只做 re-export。
- 不引入 `dist` / 构建脚本；Next 通过 `transpilePackages: ["@workspace/ui"]` 直接编译源码。
- `hooks/` 目录按需创建；`exports` 里已预留 `./hooks/*`。

## 改动前读什么

- shadcn 安装与 alias：[../../apps/frontend/CLAUDE.md](../../apps/frontend/CLAUDE.md)
- 样式与组件规则：`.claude/skills/shadcn/rules/`（styling、composition、forms、icons）
- 文档同步：[../../.claude/rules/doc-sync.md](../../.claude/rules/doc-sync.md)
- 注释规则：[../../.claude/rules/code-comments.md](../../.claude/rules/code-comments.md)

## 验证

- `pnpm --filter frontend build` 退出码 0（本包没有独立 build 脚本）。
- 新增组件后，从 `apps/frontend` 的页面 import 一次，确认路径与类型解析正常。
