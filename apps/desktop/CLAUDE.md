# CLAUDE.md

本文件是 `apps/desktop` 的包级规则。项目级规则见 [../../CLAUDE.md](../../CLAUDE.md)。

## 本包职责

Electron 桌面壳：窗口、生命周期、`app://` 静态托管与渲染进程安全边界。页面与业务在 `apps/frontend`；BFF / backend 进程不在本包托管。

## 命令与端口

```bash
pnpm --filter desktop dev       # electron-forge start，加载 http://localhost:3000
pnpm --filter desktop build     # 复制 apps/frontend/out -> renderer/
pnpm --filter desktop package   # 未打包目录 -> out/
pnpm --filter desktop make      # ZIP -> out/make/zip/win32/x64/
pnpm --filter desktop test      # vitest run --coverage，行覆盖率 ≥ 95%
pnpm --filter desktop check-types
pnpm --filter desktop lint
pnpm --filter desktop format
```

本包不监听独立端口；开发态连接 frontend 的 3000，生产态用 `app://bundle/`。

## 目录与入口

- `src/main.ts`：Electron 入口，注册 scheme 并调用 `bootstrap()`；覆盖率按框架入口排除。
- `src/preload.ts`：只暴露 `window.desktop` 的平台、版本与 `setTitleBarTheme`；类型契约在 `src/types/`。
- `src/titlebar-contract.ts`：主进程与 preload 共用的 `titlebar:set-theme` 通道常量与主题守卫，不 import Electron 运行时。
- `src/app/bootstrap.ts`：单实例锁、窗口创建、等待开发服务器、标题栏 IPC 注册、导航与权限拦截。
- `src/app/titlebar.ts`：WCO 覆盖层配色（透明底、40 高度、浅/深两套符号色）与 `titlebar:set-theme` 通道；只接受 `light` / `dark`。
- `src/protocol/protocol.ts`：`app://` 路径解析、MIME、404、CSP 与缓存头。
- `src/app/config.ts` / `src/app/navigation.ts`：开发 URL、允许 origin、外链判断。
- `src/app/devtools.ts`：开发态 `before-input-event` 快捷键（F12 / Ctrl+Shift+I）切换 DevTools。
- `src/types/index.ts`：`RendererOptions`、`WaitForServerOptions`、`BootstrapOptions`、`ProtocolHandlerOptions`、`WebContentsLike`、`DevToolsShortcutTarget`；这些都是主进程内部契约，留在本包。
- `src/types/global.d.ts`：`Window.desktop` 的全局声明，从 `@workspace/types` 导入 `DesktopBridge`。
- `scripts/copy-renderer.mjs`：检查并复制 `apps/frontend/out`。

## 本包约束

- `pnpm-workspace.yaml` 的 `nodeLinker: hoisted` 是 Forge 8 的硬性要求；不要改回 isolated，也不要用 `.npmrc` 的 `node-linker` 代替（pnpm 12 不读）。
- 本包保持零运行时 `dependencies`；新增运行时依赖必须先评估 Forge 打包与 asar 体积，优先用 Vite 打进 main/preload。
- `forge.config.ts` 的 `packagerConfig.ignore` 必须保留 `/.vite`、`/renderer` 与 `/package.json`；Vite 插件默认会丢掉 renderer。
- 窗口初始 `1280×800`、最小 `800×600`；默认应用菜单必须保持移除（`Menu.setApplicationMenu(null)`），不要加回自定义菜单。
- Windows 11 下窗口头部使用 WCO：`titleBarStyle: "hidden"` + 透明 `titleBarOverlay`，保留系统三个窗口按钮，不显示标题文字与图标；覆盖层高度固定 40，与前端 `--app-titlebar-height` 对齐。非 Windows 保持平台默认头部。若真机透明 overlay 不生效，回退为按主题上不透明底色，并记录左栏接缝的后续处理。
- 窗口标题常量仍是中文，供任务栏与 Alt-Tab 使用；不随界面语言变化，跟随语言需要另立 IPC 变更。
- 标题栏 IPC 只注册 `titlebar:set-theme` 一条通道；参数必须是 `light` / `dark`，非 win32、非法参数或窗口已销毁时直接忽略。不要把颜色、尺寸或路径开放给渲染进程，也不要新增通用 IPC。
- 系统按钮符号色跟随应用主题：浅色 `#0a0a0a`、深色 `#fafafa`；窗口创建时的初始值取 `nativeTheme.shouldUseDarkColors`，页面挂载后由前端纠正。
- DevTools 只在未打包时通过 `F12` / `Ctrl+Shift+I` 切换；打包态不得注册快捷键或调用 `openDevTools`，也不要恢复默认菜单的调试入口。
- 共享接口类型集中在 `src/types/index.ts`；`Window.desktop` 声明在 `src/types/global.d.ts`，不要在实现文件里重复定义。渲染进程可见的 `DesktopBridge` 来自 `@workspace/types`，只允许 `import type`，并放在 `devDependencies`；本包继续保持零运行时依赖。
- 渲染进程：`sandbox: true`、`contextIsolation: true`、`nodeIntegration: false`；preload 不暴露通用 IPC 或文件系统入口，标题栏通道只接受主题枚举。
- 开发态等待 `ELECTRON_RENDERER_URL` 最多 30 秒；失败必须落到诊断页（含地址与重试），不能留空白窗口。
- 权限请求默认拒绝；新增摄像头、通知等能力前先改这里并评估安全边界。
- 协议读取只允许 `app.getAppPath()/renderer` 内路径；拒绝 `..`、编码穿越与空字节，未知路径回 404 页面。
- 主进程代码运行在 Electron 45 的 Node 24.22.2 下；`@types/node` 固定 24.x，不要使用 Node 26 独有 API。
- 网络无法直连 GitHub Releases 时，安装/打包用 `ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/`。
- 不要把 Next/React 依赖加进本包；需要页面能力时改 `apps/frontend`。

## 改动前读什么

- 变更设计与任务：[../../openspec/changes/desktop-shell-integration/design.md](../../openspec/changes/desktop-shell-integration/design.md)
- 前端静态导出约束：[../frontend/CLAUDE.md](../frontend/CLAUDE.md)
- 文档同步规则：[../../.claude/rules/doc-sync.md](../../.claude/rules/doc-sync.md)
- 注释规则：[../../.claude/rules/code-comments.md](../../.claude/rules/code-comments.md)

## 验证

- `pnpm --filter frontend build` 后 `pnpm --filter desktop build`，确认 `apps/desktop/renderer/index.html` 与 `_next` 存在；删除 `apps/frontend/out` 后 build 应非零退出并提示先构建前端。
- `pnpm --filter desktop test` 用例通过，行覆盖率 ≥ 95%；`check-types`、`lint`、`format` 退出码 0。
- 开发态：frontend dev 运行后 `pnpm --filter desktop dev` 显示页面，窗口头部无标题文字与图标、系统三个按钮可用，标题栏透明且左右两栏背景无接缝；语言/主题入口位于系统按钮左侧且可点击；拖拽与双击最大化正常，拖拽不能缩到小于 800×600；按 `F12` / `Ctrl+Shift+I` 可打开或关闭 DevTools。生产态：`pnpm --filter desktop package` 后运行未打包目录，断网仍能显示页面与 404，DevTools 未打开且快捷键不生效。
- `pnpm --filter desktop make` 生成 ZIP；生产包无 Next 进程、不监听 3000、不打开 DevTools。
