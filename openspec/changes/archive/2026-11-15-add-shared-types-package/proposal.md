# Proposal

## Why

四个 app 之间目前没有任何共享类型通道：`apps/desktop` 的 `DesktopBridge` 只存在于本包，`apps/frontend` 没有声明 `window.desktop`，`apps/bff` / `apps/backend` 的 `GET /health` 返回值是内联对象。业务模块落地后，前端要消费 BFF 的响应与 SSE 事件，controller 也要标注返回形状；若每个 app 各写一份，形状会漂移，而 app 之间直接 import 又会破坏「BFF 不直接 import backend 源码」的边界。

现在建一个纯类型包，成本最低：只需要搬动一个已经跨进程使用的类型，不引入构建链路，也不绑定尚未落地的 Zod 方案。

## What Changes

- 新增 `packages/types`（`@workspace/types`）：私有、`type: module`、源码包，`exports` 指向 `./src/index.ts`，无 build、无 test、无运行时依赖。
- 收纳两类契约：`DesktopBridge`（preload 生产、渲染进程消费）与 `HealthResponse`（Nest 控制器返回的只读形状）。
- `apps/desktop` 改为从 `@workspace/types` 导入 `DesktopBridge`；`RendererOptions`、`BootstrapOptions`、`ProtocolHandlerOptions`、`WebContentsLike`、`DevToolsShortcutTarget` 等主进程内部契约**留在本地**。
- 需要消费的应用（`apps/desktop`、`apps/bff`、`apps/backend`）增加 `@workspace/types` 的 workspace 依赖，消费方只允许 `import type`；`apps/frontend` 在首次消费桥接契约或 BFF 响应时再加。
- 明确边界：controller 入参 DTO（装饰器类 + `class-validator` 校验）不进共享包；共享包只承载跨进程、被另一个 app 消费的只读数据形状。
- 同步包级三件套与根索引文档，并把新包写进 `openspec/config.yaml` 的 `context`。
- 不改变运行时行为、端口、构建产物与 Turbo 任务。

## Capabilities

### New Capabilities

- `shared-types`: 跨应用共享类型的单一入口与边界——哪些形状可以放进包、哪些必须留在 app 内、消费方以什么方式引用。

### Modified Capabilities

无。

## Impact

- 新增：`packages/types/`（`package.json`、`tsconfig.json`、`src/index.ts`、`README.md`、`CLAUDE.md`、`AGENTS.md`）。
- 修改：`apps/desktop/src/preload.ts`、`apps/desktop/src/types/index.ts`、`apps/desktop/src/types/global.d.ts`、`apps/bff/src/app.controller.ts`、`apps/backend/src/app.controller.ts`；三个消费应用的 `package.json`。
- 依赖：无第三方依赖；`pnpm install` 更新锁文件，`pnpm-workspace.yaml` 的 `packages/*` 已覆盖新目录。
- 构建：`turbo.json` 无需改动（该包无 `build` / `test` 脚本）。
- 文档：`README.md`、`CLAUDE.md`、`AGENTS.md`、`openspec/config.yaml` 的 `context`，以及新包的三份包级文档。
- 风险：纯类型包一旦出现运行时值，Node 会拒绝加载 node_modules 内的 `.ts`；该边界必须靠 `import type` 与评审守住，落地后需 grep `dist/` 确认 Nest 产物没有运行时引用。
