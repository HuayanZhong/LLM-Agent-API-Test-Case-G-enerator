# CLAUDE.md

本文件是 `packages/types` 的包级规则。项目级规则见 [../../CLAUDE.md](../../CLAUDE.md)。

## 本包职责

`@workspace/types`：跨应用共享的只读类型契约。只有类型导出，没有运行时值、没有 build、没有进程与端口。

## 命令与端口

- 无端口、无 `dev` / `build` / `test` 脚本。
- `pnpm --filter @workspace/types check-types` 做本包类型检查。
- `pnpm --filter @workspace/types lint` / `format` 检查源码，配置用根 `.oxlintrc.json` / `.oxfmtrc.json`。
- 验证通过消费方进行：`pnpm check-types` 与各应用 `build`。

## 目录与入口

- `src/index.ts`：分层汇总，只 `export type *`，不放具体定义。
- `src/api/`：跨进程 HTTP / SSE 的只读形状（当前 `HealthResponse`）；`src/api/index.ts` 层内收口。
- `src/bridge/`：preload 暴露给渲染进程的契约（当前 `DesktopPlatform`、`DesktopBridge`）；`src/bridge/index.ts` 层内收口。
- `package.json` 的 `exports` 指向 `./src/index.ts`，消费方靠 `import type` 在编译期取用。

## 本包约束

- 只收跨进程、被另一个应用消费的只读数据形状；应用内部契约留在各自包里。
- controller 入参 DTO、装饰器与校验规则不进本包；控制器只能标注输出形状，值仍在应用内构造。
- Electron 主进程内部类型（窗口、协议、测试注入）不进本包；只有渲染进程可见的桥接对象可以进。
- 不写常量、函数、类或任何运行时值；也不引入第三方运行时依赖。出现运行时 schema 需求时另开变更。
- 按层存放：`api/` 与 `bridge/` 各自收口，层与层之间不互相 import；新增运行时代码就说明边界选错了。
- 顶层 `index.ts` 只做分层汇总；不要把它变成堆放所有类型的单文件。
- 层内相对 import 只用于 `export type *` 汇总，按 NodeNext 写 `.js` 后缀。本包没有运行时值，所以这些 import 会被完全擦除；不要在这里加常量、函数或类。
- 消费方只允许 `import type`，并把依赖放在 `devDependencies`；构建后产物中不应出现对 `@workspace/types` 的运行时引用。
- 不做全局声明增强；`Window.desktop` 这类声明仍留在消费应用自己的 `global.d.ts`。

## 改动前读什么

- 行为规格：`shared-types` 能力，归档后位于 `openspec/specs/shared-types/spec.md`；索引见 [openspec/specs/](../../openspec/specs/)
- 文档同步规则：[../../.claude/rules/doc-sync.md](../../.claude/rules/doc-sync.md)
- 注释规则：[../../.claude/rules/code-comments.md](../../.claude/rules/code-comments.md)
- 包本地说明：[README.md](README.md)

## 验证

- `pnpm --filter @workspace/types check-types`、`lint`、`format` 退出码 0。
- 改类型后跑消费方的 `check-types` 与 `build`：`pnpm --filter desktop check-types`、`pnpm --filter bff check-types`、`pnpm --filter backend check-types`。
- 构建后 `grep -r "@workspace/types" apps/bff/dist apps/backend/dist` 无输出。
