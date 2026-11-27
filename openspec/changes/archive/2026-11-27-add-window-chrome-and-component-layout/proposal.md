# Proposal

## Why

Electron 桌面壳当前使用 Windows 原生标题栏，窗口顶部是一条与页面主题割裂的灰白系统栏；标题文字与系统按钮占据独立高度，登录页的双栏背景无法延伸到窗口顶部。用户希望保留系统的最小化、最大化、关闭，但去掉标题文字与图标，让这条头部融进页面背景。

同时，`apps/frontend/src/components` 把布局级 Provider（主题、语言、点击特效）与窗口级可交互控件（主题、语言切换）混在同一层；`(auth)/_components` 也把品牌、表单、字段平铺在一个目录。新增全局标题栏后，如果不先分层，布局组合、控件与业务表单会继续互相引用。

## What Changes

- Windows 桌面壳启用窗口控件覆盖层（Window Controls Overlay，WCO）：`titleBarStyle: "hidden"` + `titleBarOverlay`，保留系统三个窗口按钮，去掉标题文字与图标。
- overlay 背景透明，页面背景直接透出；系统按钮符号色随应用深浅色主题同步。
- 新增一条窄 IPC 通道 `titlebar:set-theme`；preload 只暴露 `setTitleBarTheme(theme)`，只接受 `light` / `dark`，不开放通用 IPC。
- 前端新增全局标题栏组件：固定在窗口顶部、无标题/图标、透明背景、可拖拽；语言与主题切换钮位于系统按钮左侧。
- 语言/主题入口从认证布局右上角的 fixed 块移入全局标题栏，由根 layout 统一挂载；浏览器预览下同样可用。
- 组件目录按职责重排：全局拆 `layout/` 与 `controls/`；认证私有拆 `brand/`、`forms/`、`fields/`；`packages/ui` 保持 CLI 管理的平铺结构。
- 同步测试、包级与根级文档、`openspec/config.yaml`，附 changeset。

## Capabilities

### New Capabilities

- `frontend-components`: 全局组件与路由私有组件的目录分层、依赖方向，以及共享 UI 组件的 CLI 边界。

### Modified Capabilities

- `desktop-shell`: 窗口头部从原生标题栏改为 WCO；preload 增加标题栏主题同步接口；主窗口最小尺寸规格与实现对齐为 800×600。
- `ui-localization`: 语言与主题入口从认证页右上角移到全局窗口标题栏，位于系统按钮左侧。
- `login-page`: 登录页复用全局标题栏入口；主题按钮位置描述同步。
- `register-page`: 注册页复用全局标题栏入口；主题按钮位置描述同步。

## Impact

- 桌面壳：`apps/desktop/src/app/bootstrap.ts`、新增 `src/app/titlebar.ts`、`src/preload.ts`、窗口选项与 IPC 注册、对应测试。
- 前端：`apps/frontend/src/components/layout/`、`src/components/controls/`、`src/app/(auth)/_components/{brand,forms,fields}/`、根 layout、认证 layout 与相关测试。
- 类型：`@workspace/types` 的 `DesktopBridge` 增加 `setTitleBarTheme`；`apps/frontend` 以 devDependency 引用 `@workspace/types`，并在 `src/types/global.d.ts` 声明可选的 `Window.desktop`。
- 样式：`packages/ui/src/styles/globals.css` 新增 `--app-titlebar-height`；不新增依赖。
- 文档：`apps/desktop`、`apps/frontend`、`packages/types` 的 README / CLAUDE / AGENTS，根 README / CLAUDE / AGENTS，以及 `openspec/config.yaml`。
- 不改动：URL、静态导出路径、`app://` 入口、BFF / backend、`packages/ui` 的组件目录。
- 明确不做：自绘最小化/最大化/关闭、macOS traffic lights、`packages/ui` 目录重排、窗口标题跟随界面语言、无边框窗口的圆角与阴影定制。
