# Design

## Context

见 `proposal.md`。仓库当前有四个 app 与三个 packages，全部是源码包、没有 `dist`：`packages/vitest-config` 与 `packages/typescript-config` 刻意不引入构建脚本，消费方通过 workspace 链接直接读源码。`apps/desktop` 的 `src/types/index.ts` 混放了主进程内部契约与 preload 暴露的 `DesktopBridge`；`apps/frontend` 不声明 `window.desktop`；`apps/bff` / `apps/backend` 的 `GET /health` 返回值内联，没有共享形状。app 之间不能互相 import（BFF 规则明确禁止直接 import backend 源码），因此跨应用契约只能经由 `packages/`。

`packages/typescript-config/base.json` 的 `module: NodeNext`、`isolatedModules: true` 与各 app 的 tsconfig 决定了类型解析方式；`pnpm-workspace.yaml` 的 `packages/*` 已覆盖新目录。

## Goals / Non-Goals

**Goals:**

- 建一个零运行时、零构建的共享类型包，四个 app 都能只靠 `import type` 使用。
- 把已经跨进程使用的 `DesktopBridge` 变成单一来源，同时把 controller 入参与主进程内部契约挡在包外。
- 不改变任何 app 的运行时行为、端口与构建产物。

**Non-Goals:**

- 不引入 Zod schema、OpenAPI 生成或任何运行时契约。
- 不迁移 `RendererOptions`、`BootstrapOptions`、`ProtocolHandlerOptions`、`WebContentsLike`、`DevToolsShortcutTarget` 等主进程内部类型。
- 不在共享包中镜像前端请求体、表单模型或 controller DTO 字段。
- 不改 `turbo.json`、`pnpm-workspace.yaml` 与 CI 工作流。
- 不给共享包加 `test` 脚本或覆盖率门槛。

## Decisions

### 1. 包名 `@workspace/types`，路径 `packages/types`

与 `@workspace/ui` 的命名一致，名字描述内容而不是消费方。备选 `@workspace/contracts` 会让名字暗示运行时契约与校验，等 Zod 方案落地时容易误导，暂不采用；备选 `@workspace/shared` 过于宽泛，会长成垃圾桶。

### 2. 纯类型源码包，不引入构建

`package.json` 设 `private: true`、`type: module`、`exports: { ".": "./src/index.ts" }`，没有 `build` 脚本与 `dist`，与 `packages/vitest-config` 的结构一致。备选「tsc 产 `dist` + `.d.ts`」需要新增 `build` 任务、`^build` 依赖与发布路径切换，为一份不含运行时代码的类型付构建债，不划算。

这也是唯一能保证 Nest 侧安全的形态：`dist` 里不会出现对该包的运行时 import。一旦包内出现运行时值，Node 会拒绝从 node_modules 加载 `.ts`（类型剥离对 node_modules 禁用），workspace 软链的 realpath 是否绕过尚未验证——那一步应作为独立变更重新评估，而不是现在预留构建链路。

### 3. 包内容只收两类形状

- `DesktopBridge`：preload 生产、渲染进程读取，是唯一的跨端运行时对象契约。把 `platform` 从 `NodeJS.Platform` 改成本地字符串联合（`"win32" | "darwin" | "linux" | ...`），让包不依赖 `@types/node`；preload 传入的 `process.platform` 仍是该联合的子集，赋值安全。
- `HealthResponse`：`{ status: "ok"; service: string }`，bff 与 backend 的控制器用它标注返回值，值仍在各自 app 内构造。

主进程内部类型留在 `apps/desktop/src/types/index.ts`：它们是 Electron 窗口、协议与测试注入的实现细节，搬出去会让前端与后端在类型环境里看到无关的 Electron 语义。

### 4. controller 入参不进共享包

入参 DTO 是带装饰器的类，必填、范围与正则校验都在 `class-validator` 管道里，类型系统表达不了。只搬字段形状会得到一个「看起来是单一事实源、实际更弱」的假中心，还会把 `@nestjs/*`、`class-validator`、`reflect-metadata` 拖进本应零依赖的包。请求体类型的未来方案是 OpenAPI 生成，而不是手工镜像。

允许的写法只有输出侧标注：controller 声明 `health(): HealthResponse`，类与装饰器仍留在 app 内。

### 5. 按层目录组织，顶层只做汇总

```text
src/
├── index.ts        # export type * from "./api" / "./bridge"，不放定义
├── api/            # 跨进程 HTTP / SSE 只读形状
│   ├── index.ts
│   └── health.ts
└── bridge/         # preload ↔ 渲染进程契约
    ├── index.ts
    └── desktop.ts
```

`api/` 与 `bridge/` 各自用 `index.ts` 收口，层与层之间不互相 import；顶层 `index.ts` 只 re-export。后续的 Case IR / 报告另起 `domain/` 层，不塞进 `api/`。

备选「单文件 `src/index.ts`」把接口形状与桌面桥接对象混在一起，边界会随业务接入变得模糊，不采用。层内相对 import 只用于 `export type *` 汇总，按 NodeNext 写 `.js` 后缀；因为全是类型导出，编译后完全擦除，不会触发 `packages/vitest-config` 记录的运行时后缀问题。等某一层出现独立消费者时再加子路径导出（`./api`、`./bridge`），现在不预置未使用的入口。

### 6. 不设 `test` 脚本

纯类型没有可执行代码，硬套 95% 行覆盖率会直接失败。`packages/typescript-config` 与 `packages/vitest-config` 都是只有 `check-types` / `lint` / `format` 的先例。该包的验证靠消费方：`pnpm check-types`、四个 app 的 `build`、以及对产物的 grep。

### 7. 依赖放 `devDependencies`，只允许 `import type`

desktop、bff、backend 以 `"@workspace/types": "workspace:*"` 加到 `devDependencies`：类型只在编译期使用，desktop 继续保持零运行时依赖；frontend 尚未消费任何共享形状，等首次接入时再加，避免留下无用依赖。`base.json` 的 `isolatedModules` 保证类型导入可以被完全擦除；约定与评审负责不让值导入混进来，构建后用 grep 复核。

`Window.desktop` 的全局声明仍留在 `apps/desktop/src/types/global.d.ts`，共享包不做全局增强，避免把 Electron 的桥接对象塞进 bff / backend 的全局类型环境。前端若将来要读 `window.desktop`，在自己的声明文件里引用同一类型。

## Risks / Trade-offs

- [运行时值混进包] → 规格与包级 CLAUDE 写明准入规则；一旦需要 Zod，另开变更决定是加构建还是拆 `packages/schemas`；落地后 grep 各 app 产物确认无运行时引用。
- [`exports` 指向 `.ts` 在 Nest 的 `NodeNext` 解析下可能不可用] → 用 `pnpm check-types` 先验证；失败再评估改为 `.d.ts` 入口或独立构建，而不是凭猜测加构建。
- [`DesktopPlatform` 联合与 Node 平台列表漂移] → 联合是包内单一来源，升级 Node 类型时同步；preload 的赋值由 `check-types` 兜底。
- [前端未声明 `window.desktop`] → 本期不处理；页面接入桥接对象时由前端补声明，不扩大本变更。
- [新包增加文档同步面] → 一次补齐三份包级文档与根索引，避免出现「包存在但索引没有」的半成品。
- [共享包成为新的耦合点] → 准入规则只允许只读输出形状，且包内无运行时值；耦合仅停留在类型层，移除成本低。

## Migration Plan

单次提交，无数据迁移。顺序：建包 → `pnpm install` 更新锁文件 → 迁移 `DesktopBridge` 与 `HealthResponse` → 补齐文档。验证：`pnpm check-types`、`pnpm lint`、`pnpm format`、`pnpm build`、`pnpm test` 全部退出码 0；grep `apps/bff/dist`、`apps/backend/dist` 与前端产物，确认没有 `@workspace/types` 的运行时引用。回滚直接 revert 本次提交。

## Open Questions

- Zod 落地时，是在本包引入构建产物，还是拆出独立的 `packages/schemas`？这取决于当时的消费方式（Nest 运行时校验 vs 仅前端解析），不影响本变更的方案与任务拆分。
