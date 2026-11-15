# @workspace/types

跨应用共享的只读类型契约包。只发类型、不做 build、没有运行时产物；消费方只用 `import type`。

## 职责

给 `apps/` 之间提供唯一合法的类型通道：桌面壳 preload 与渲染进程共享的桥接对象、Nest 控制器的只读响应形状。应用之间不直接 import，跨应用契约统一从这里引用。

## 运行

本包没有 `dev` / `build` / `test` 脚本；类型只有编译期意义，不设覆盖率门槛。

```bash
pnpm --filter @workspace/types check-types
pnpm --filter @workspace/types lint     # oxlint .，根配置
pnpm --filter @workspace/types format   # oxfmt --check .，根配置
```

消费方在 `devDependencies` 声明：

```json
"@workspace/types": "workspace:*"
```

```ts
import type { HealthResponse } from "@workspace/types"
```

## 目录

```text
packages/types/
├── src/
│   ├── index.ts        # 分层汇总，只 re-export，不放定义
│   ├── api/            # 跨进程 HTTP / SSE 的只读形状
│   │   ├── index.ts    # 层内收口
│   │   └── health.ts   # HealthResponse
│   └── bridge/         # preload 与渲染进程之间的契约
│       ├── index.ts    # 层内收口
│       └── desktop.ts  # DesktopPlatform、DesktopBridge
├── package.json        # exports 指向 ./src/index.ts，无 build
├── tsconfig.json       继承 @workspace/typescript-config/base.json
├── README.md
├── CLAUDE.md
└── AGENTS.md
```

## 依赖与边界

- 零运行时依赖；`devDependencies` 只有 `typescript` 与 `@workspace/typescript-config`。
- 准入：跨进程、被另一个应用消费的只读数据形状（响应体、SSE 事件、preload 桥接对象）。
- 不收：controller 入参 DTO 与校验规则、Electron 主进程内部契约、React/Next/Nest 框架类型、任何常量或函数。
- 按层存放：`api/` 放跨进程响应与事件，`bridge/` 放 preload 契约；后续的 Case IR / 报告放独立层。层内用 `index.ts` 收口，层与层之间不互相 import，顶层 `index.ts` 只做汇总。
- 层内相对 import 只用于 `export type *` 汇总（NodeNext 下写 `.js` 后缀）；不要在这里放运行时值。一旦出现运行时值，Nest 的 `dist` 会在 Node 下加载 node_modules 内的 `.ts` 并失败；需要运行时 schema 时另开变更评估构建方案。

## 相关文档

- 根入口：[../../README.md](../../README.md)、[../../CLAUDE.md](../../CLAUDE.md)、[../../AGENTS.md](../../AGENTS.md)
- 文档同步规则：[../../.claude/rules/doc-sync.md](../../.claude/rules/doc-sync.md)
- 共享 tsconfig 包：[../typescript-config/README.md](../typescript-config/README.md)
- 行为规格：`shared-types` 能力，归档后位于 `openspec/specs/shared-types/spec.md`；索引见 [openspec/specs/](../../openspec/specs/)
