# Proposal

## Why

当前仓库的前端仍是浏览器形态，三个服务需要分别启动；毕设交付要求一个可独立运行的桌面应用。Electron Forge 能提供打包、安装包与分发管线，但官方没有 Next.js 集成方案，因此需要明确一套“Next 静态导出 + Electron 托管”的桌面壳方案，让前端可以脱离开发服务器运行。

## What Changes

- 新增 `apps/desktop` workspace 包：Electron Forge 8 + Electron 45；Vite 插件只编译 main / preload；主进程负责窗口、`app://` 协议、导航白名单与安全配置，preload 只暴露最小信息。
- 前端改为静态导出：`next.config.ts` 设置 `output: "export"`、`trailingSlash: true`、`images.unoptimized`；**BREAKING** 移除 `next start`，前端不再提供 SSR、动态 Route Handler、Server Actions、cookies、rewrites/redirects/headers、proxy、ISR 等依赖 Next 服务端的能力。
- 开发态 Electron 加载 `http://localhost:3000`；生产态由主进程通过 `app://` 自定义协议托管 `apps/frontend/out`，打包后不存在 Next 运行时进程。
- Forge 打包：`packagerConfig.asar`、Fuses 安全开关、`maker-zip`；先产出 Windows x64 的可独立运行 ZIP，不包含 BFF / backend / MCP 进程托管。
- 构建接线：`turbo.json` 增加 `desktop#build`，依赖 `frontend#build` 并把 `out/` 复制到 `apps/desktop/renderer/`；根 `pnpm dev` 并行启动 desktop。
- 文档同步：新增 `apps/desktop` 的 README / CLAUDE / AGENTS；更新根 README、CLAUDE、AGENTS、`openspec/config.yaml` 的 context；修改技术架构 candidate 中的桌面端措辞并重新生成 HTML。
- 不在本期范围：BFF / backend / chrome-devtools MCP 的进程托管、BFF CORS 与 SSE、自动更新、代码签名、Squirrel / MSI 安装器、多平台 CI 安装包。

## Capabilities

### New Capabilities

- `desktop-shell`: Electron 桌面壳的行为边界，包括开发态加载 Next dev server、生产态托管静态导出、窗口生命周期、渲染进程安全隔离与离线打包运行。

### Modified Capabilities

无。当前 `openspec/specs/` 还没有已归档的行为规格，本次不修改既有 capability。

## Impact

- 代码：新增 `apps/desktop`；修改 `apps/frontend/next.config.ts` 并从其 `package.json` 移除 `start`；调整 `pnpm-workspace.yaml`、`turbo.json`、根文档。
- 依赖：新增 `electron`、`@electron-forge/cli`、`@electron-forge/plugin-vite`、`@electron-forge/plugin-fuses`、`@electron-forge/maker-zip`、`@electron/fuses`，使用 `catalog:desktop` 管理。
- 构建与运行：`pnpm dev` 会额外启动 Electron；`turbo build` 增加静态导出与 renderer 复制；`pnpm --filter frontend start` 不再可用。
- 文档：`doc/source/technical-architecture.candidate.json` 与重新生成的 `doc/technical-architecture.html` 需要反映“主进程托管静态资源、不拉起 Next 进程”。
- 后续独立变更：BFF / backend / MCP 进程托管、CORS/SSE、自动更新、签名与安装器。
