# Design

## Context

参见 `proposal.md` 与 `specs/desktop-shell/spec.md`。当前仓库是 pnpm monorepo：前端为 Next.js 16 App Router，BFF 与 backend 是独立 NestJS 服务；Electron 尚未接入。主要约束：

- Forge 打包会朴素遍历 `node_modules`，不处理 pnpm 默认的 symlink 布局；如果桌面包有运行时依赖，可能必须改仓库级 `node-linker=hoisted`。
- Forge 官方没有 Next.js 集成；Vite / webpack 插件只适合它们自己接管的 renderer。
- 用户已确认 Next 不使用自身服务端能力，BFF 已承担会话、SSE 与聚合。
- Electron 45 内置 Node 24.22.2，而仓库开发 Node 为 26.12.1；主进程代码与类型要对齐前者。

## Goals / Non-Goals

**Goals:**

- 交付一个独立的 Electron 桌面壳，开发态加载 Next dev server，生产态托管静态导出。
- 打包产物不依赖系统 Node、仓库 `node_modules` 或 Next 服务器。
- 保持渲染进程安全隔离与最小 preload 接口。
- 构建、测试、文档与现有 pnpm / Turbo / Oxc 约定一致。

**Non-Goals:**

- 主进程托管 BFF / backend / chrome-devtools MCP，或管理它们的端口与退出。
- BFF CORS、SSE、会话与鉴权；本期不产生跨 origin 的 API 调用。
- 自动更新、代码签名、Squirrel / MSI 安装器、多平台 CI 安装包。
- 浏览器 SSR 部署路径；`next start` 会被移除。

## Decisions

### 1. 生产态用 Next 静态导出 + `app://`，不内嵌 Next 服务

`next build` 输出 `apps/frontend/out`，Electron 主进程注册 `app` scheme（`standard: true`、`secure: true`、`supportFetchAPI: true`），用 `protocol.handle` 从 asar 中读取文件。渲染进程 origin 为 `app://bundle`，根相对资源 `/_next/**` 可直接解析。

- 备选：内嵌 `.next/standalone` + `utilityProcess` 启动 Next。保留 SSR/Server Actions，但需要处理 asar 解包、端口、启动竞态、退出清理与 Windows standalone 符号链接，且与 BFF 职责重叠。用户已排除 Next 服务端能力，故不采用。
- 备选：`file://` + `loadFile`。静态导出的资源是根相对路径，`file://` 下会解析到磁盘根，且存储 API / fetch 行为不一致，故不采用。
- 备选：主进程起一个 loopback HTTP 静态服务器。实现简单，但增加本地端口、CORS 与攻击面，故不采用。

### 2. 新建 `apps/desktop`，保持零运行时依赖；仓库级启用 hoisted

桌面包只放 main / preload / `renderer` / `package.json`；React、Next、`@workspace/ui` 都只在前端构建期使用。Forge 打包时 prune 掉全部 devDependencies，asar 因此只包含 `.vite/build`、`renderer` 与 `package.json`。

Spike 结果显示，Forge 8 在 `start` 与 `package` 前会强制检查 pnpm 配置：`nodeLinker` 必须是 `hoisted`（或自定义 hoist pattern），否则直接失败。零运行时依赖不能绕过该检查。pnpm 12 的配置读取以 `pnpm-workspace.yaml` 为准，`.npmrc` 的 `node-linker` 不生效，因此仓库根 `pnpm-workspace.yaml` 必须增加 `nodeLinker: hoisted`。这会改变全仓库的 `node_modules` 布局，需要在同一变更中重装并跑完整测试。

- 备选：把 Forge 塞进 `apps/frontend`。会让 `next` / `react` 等工作区依赖进入打包扫描路径，且前端与桌面生命周期耦合，故不采用。
- 备选：声明 `frontend` 为 desktop 的 workspace devDependency 以获得 Turbo 构建顺序。会引入一条 workspace symlink；改用 Turbo package-specific 任务 `desktop#build` 依赖 `frontend#build`。
- 备选：只用 `pnpm deploy` staging 或跳过 Forge 的 system check。前者增加两套安装与脚本，后者依赖未文档化的本机 flag，不可持续，故不采用。

### 3. Forge 8 + `plugin-vite` 只编译 main / preload

`@electron-forge/plugin-vite` 的 `renderer` 可为 `[]`（插件只要求数组），因此：

- `vite.main.config.mts` 产出 `.vite/build/main.cjs`；
- `vite.preload.config.mts` 产出 `.vite/build/preload.cjs`；
- `package.json` 的 `main` 指向 `.vite/build/main.cjs`；
- renderer 由 Next 静态导出提供，不进入 Vite。

这样保留 Forge 的 dev watch / 重启与打包集成，又不用 webpack；preload 用 `.cjs` 规避沙箱下 ESM preload 的限制。注意 Vite 插件默认把 `packagerConfig.ignore` 设为“只保留 `.vite`”，因此必须在 Forge 配置里覆盖 ignore，显式保留 `renderer` 与 `package.json`，否则静态资源不会进入 asar。

### 4. 开发态由 Turbo 启动 Next，Electron 只负责等待和加载

根 `pnpm dev` 并行启动 frontend、bff、backend、desktop。桌面 main 读取 `ELECTRON_RENDERER_URL`（默认 `http://localhost:3000`），启动时轮询该地址，带超时与重试；不在桌面进程里再拉起一个 Next dev server，避免双实例与端口冲突。Turbo 的 `dev` 任务把该变量加入 `env`。

### 5. 静态导出配置固定为 `export + trailingSlash + unoptimized images`

- `trailingSlash: true` 让路由输出为 `foo/index.html`，`app://` 解析规则稳定，刷新深层路由不会 404。
- `images.unoptimized: true` 是静态导出下 `next/image` 默认 loader 的限制；提前显式配置，避免后续页面踩坑。
- 从 `apps/frontend/package.json` 删除 `start`；`next start` 与导出模式不兼容。

### 6. 协议解析优先精确文件，再做 HTML 回退

解析顺序：精确路径（覆盖 `_next/static`、`.js/.css/.woff2/.txt` 等）→ `/` 映射 `index.html` → `path/index.html` → `path.html` → `404.html`（404 状态）。读取根固定为 `app.getAppPath()/renderer`，解析后必须仍在根目录内；拒绝 `..`、编码穿越与空字节。使用 `fs.promises.readFile`（Electron 已 patch asar 读取），并维护 MIME 表；不依赖 `net.fetch(file://)` 对 asar 的实现细节。

### 7. 安全默认值

- `sandbox: true`、`contextIsolation: true`、`nodeIntegration: false`、`webSecurity: true`。
- preload 只暴露 `platform`、`versions` 等静态信息；本期不暴露通用 IPC 通道。
- `will-navigate` 只允许 dev origin / `app://bundle/`；`setWindowOpenHandler` 拒绝新窗口，http(s) 外链交给 `shell.openExternal`；拒绝未知权限请求。
- Fuses：`RunAsNode=false`、`EnableNodeOptionsEnvironmentVariable=false`、`EnableNodeCliInspectArguments=false`、`EnableCookieEncryption=true`、`OnlyLoadAppFromAsar=true`。`EmbeddedAsarIntegrityValidation` 不启用：需要额外的 ASAR 完整性元数据与代码签名链路，当前 ZIP 未签名；打包后已用 `@electron/fuses` 读取确认其余 fuses 生效。
- 静态 HTML 的 CSP 先允许 `script-src 'self' 'unsafe-inline'`（Next 静态导出含内联 hydration 脚本）；后续再评估 hash/nonce。

### 8. `@types/node` 对齐 Electron 运行时

桌面包单独使用 `@types/node` 24.x（Electron 45 的 Node 24.22.2），不继承仓库 tooling 的 26.x。否则 TypeScript 会放行 Electron 运行时不存在的新 API。

### 9. 打包先 ZIP，安装器后置

`@electron-forge/maker-zip` 无需 WiX / NuGet 等外部工具，产物可直接解压验证。Squirrel / MSI 属于后续变更；如果以后加 Squirrel，需要 `electron-squirrel-startup`，应通过 Vite 打进 main，而不是新增运行时依赖。

### 10. 构建接线

```json
"desktop#build": {
  "dependsOn": ["frontend#build"],
  "outputs": ["renderer/**"]
}
```

`scripts/copy-renderer.mjs` 检查 `../frontend/out/index.html`，存在则清空并复制到 `renderer/`，缺失则非零退出并提示先构建前端。根 `pnpm build` 因此先静态导出、再复制，不触发 Electron 下载或安装包构建。

## Risks / Trade-offs

- **Forge 强制 pnpm hoisted** → Spike 已确认：Forge 8 在 start/package 前直接检查 `nodeLinker`，零运行时依赖不能绕过。仓库根 `pnpm-workspace.yaml` 设 `nodeLinker: hoisted`，并在同一变更内重装、跑完整测试；pnpm 12 的 `.npmrc` 写法不生效。
- **asar 内协议读取** → Spike 已在打包产物上验证 `protocol.handle('app')` + `fs.readFile` 可从 asar 读取；自定义 ignore 必须保留 `renderer`，否则 asar 只有 `.vite`。
- **Electron 二进制下载** → 本机直连 GitHub Releases 会 `fetch failed`，Spike 使用 `ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/` 成功；README 记录该变量，CI 若可直连则无需设置。
- **静态导出能力回退** → 一旦页面使用 Server Actions、cookies、rewrites、ISR 等，`next build` 会失败；在前端 CLAUDE 写清约束，让问题在构建期暴露。
- **Node 类型漂移** → 桌面包固定 `@types/node` 24；主进程避免使用 Node 26 独有 API。
- **Forge 与 Turbo TUI 的交互** → Forge 在非 TTY 下不进入交互模式；若 `pnpm dev` 仍冲突，把 desktop dev 拆为独立命令，不改规范。
- **CSP 放宽** → `unsafe-inline` 降低 XSS 防护；本期内容为本地静态资源，后续再收紧并验证。
- **Electron 二进制下载成本** → CI 的 quality / test / build 任务可设 `ELECTRON_SKIP_BINARY_DOWNLOAD=1`；只有打包任务需要真实二进制。
- **产品名与产物命名** → 包名 / exe 用 ASCII，窗口标题用中文，避免 Windows 安装包路径与文件名问题。

## Migration Plan

1. P0 spike 已验证 pnpm + Forge 打包：仓库根 `pnpm-workspace.yaml` 设 `nodeLinker: hoisted`，重装后进入 P1。
2. P1 前端切静态导出；这是 **BREAKING**，`next start` 失效。同步修改前端与根文档。
3. P2–P4 新增桌面包、运行时、打包；在 Windows 上验证 ZIP 与离线启动。
4. P5 更新根文档、OpenSpec context、技术架构图并重新生成 HTML。
5. 回滚：还原 `next.config.ts` / `package.json` 的导出配置与 `start` 脚本，移除 `apps/desktop` 与 `desktop#build` 即可回到浏览器开发形态；无数据迁移。

## Open Questions

- 产品名与图标：已定为 `ApiTestAgent` / `api-test-agent`，窗口标题中文；图标暂用 Electron 默认，后续补 `.ico`。
- 根 `pnpm dev` 长期包含 Electron：已验证可行，保留当前行为；若 TUI 体验不佳再拆 `dev:desktop`。
- CSP 是否收紧到 hash / nonce：需要额外构建步骤，留到后续安全加固。
