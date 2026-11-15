# Design

## Context

见 `proposal.md`。当前 `apps/desktop` 是 Forge 8 + Vite 插件的最小桌面壳：入口固定为 `src/main.ts` / `src/preload.ts`，其余实现文件平铺在 `src/` 根目录；`bootstrap()` 负责单实例、窗口、协议、导航与权限。窗口选项目前只有初始尺寸与安全 `webPreferences`，没有最小尺寸；开发态不打开 DevTools；默认应用菜单未显式移除。

## Goals / Non-Goals

**Goals:**

- 窗口不能被缩到不可用尺寸。
- 窗口不再显示默认应用菜单，外观接近产品应用。
- 开发态启动即可用 DevTools 调试；打包态保持无调试入口。
- `src/` 按职责分组，类型契约集中存放，为后续 IPC / 进程托管留出位置。

**Non-Goals:**

- 不改渲染进程安全边界（`sandbox` / `contextIsolation` / `nodeIntegration`）与 Fuses。
- 不引入自定义应用菜单、托盘、多窗口或 IPC。
- 不改 `app://` 资源解析、单实例锁、导航与权限策略。
- 不调整 `apps/frontend` 的页面与布局。

## Decisions

### 1. 最小尺寸取 1024×800

初始尺寸为 1280×800，最小尺寸取 1024×800：宽度允许在 1366×768 笔记本上并排显示，高度与初始高度一致，避免纵向被压缩后页面内边距与外层卡片互相挤压。`minWidth` / `minHeight` 直接放进 `getWindowOptions` 的返回值，便于单测断言，不依赖运行时事件。

### 2. 用 `Menu.setApplicationMenu(null)` 而不是 `autoHideMenuBar`

`autoHideMenuBar: true` 只是隐藏，按 Alt 仍会唤出菜单，不满足「不显示」。在 `app.whenReady()` 之后调用 `Menu.setApplicationMenu(null)`，Windows 上彻底没有菜单栏。代价是默认菜单提供的快捷键（`Ctrl+Shift+I`、缩放、全屏等）一并消失；开发态由程序主动打开 DevTools 补回调试入口，打包态本就不应暴露这些入口。macOS 的应用菜单属于系统级常驻，当前产物只发 Windows x64 ZIP，故不在本期处理；若后续增加 macOS 构建，需重新评估该决策。

### 3. DevTools 由开发态快捷键切换，打包态不注册

默认应用菜单被移除后，`Ctrl+Shift+I` / F12 不再有默认 accelerator，需要在开发态显式绑定。使用 `webContents.on("before-input-event")` 监听 `F12` 与 `Ctrl+Shift+I`，命中后 `preventDefault()` 并调用 `toggleDevTools()`；只在 `!isPackaged` 时注册，打包态既不自动打开、也没有快捷键入口。不用 `openDevTools()` 自动打开，是因为每次 `activate` 重建窗口都会弹出调试面板并压缩可视区域，手动切换更符合日常开发。备选 `globalShortcut` 是应用级快捷键，窗口失焦时也会响应，且需要额外的注销管理，不如 `before-input-event` 局部。打包态不做 `devtools-opened` 强制关闭：本期只保证应用界面没有入口，若后续需要硬性限制再单独评估。

### 4. `src/` 按职责分组，两个 Forge 入口留在根

Forge Vite 插件的入口写死在 `forge.config.ts` 的 `build[].entry`（`src/main.ts`、`src/preload.ts`），移动入口会牵动构建配置，收益不大，因此保留在 `src/` 根。其余文件按职责收敛：

```text
src/
├── main.ts          # 入口：scheme 注册 + bootstrap()
├── preload.ts       # 入口：最小 contextBridge
├── app/             # 窗口生命周期与策略
│   ├── bootstrap.ts
│   ├── config.ts
│   └── navigation.ts
├── protocol/        # app:// 协议处理
│   └── protocol.ts
└── types/           # 共享契约
    ├── index.ts
    └── global.d.ts
```

备选「全部塞进一个 `src/index/`」会让协议与窗口生命周期耦合，备选「每个文件一个目录」则过度拆分；按上面三层足够表达边界。

### 5. 类型集中到 `types/`，`global.d.ts` 保留为声明文件

`types/index.ts` 收纳 `RendererOptions`、`WaitForServerOptions`、`BootstrapOptions`、`ProtocolHandlerOptions`、`WebContentsLike` 以及 preload 暴露的 `DesktopBridge`；`types/global.d.ts` 只保留 `Window.desktop` 的全局声明，并从 `index.ts` 导入 `DesktopBridge`，消除 preload 与声明文件之间的重复结构。`global.d.ts` 不能改成普通 `.ts`，否则 `declare global` 的模块边界与覆盖率排除都要重写。两个文件都是纯类型，`vitest.config.ts` 的 `coverage.exclude` 增加 `src/types/**`，避免覆盖率统计出现空文件。

## Risks / Trade-offs

- [菜单移除后丢失默认快捷键] → 开发态自动打开 DevTools；页面刷新可用 DevTools 内的快捷键，打包态不需要这些操作。
- [开发态快捷键与页面输入冲突] → 只在 `keyDown` 且精确匹配 `F12` 或 `Ctrl+Shift+I` 时拦截，其余按键保持原样；打包态不注册监听。
- [打包态没有硬性禁止 DevTools] → 本期只移除菜单与快捷键入口；外部启动参数场景留到安全加固变更。
- [文件移动导致导入与覆盖率配置断裂] → 用 `check-types`、`test`、`lint` 验证；测试只改导入路径，不改断言逻辑。
- [macOS 菜单行为与 Windows 不同] → 本期只交付 Windows x64 ZIP；macOS 构建加入时重新评估菜单策略。
- [最小尺寸与未来页面布局冲突] → 1024×800 是下限而非固定值，后续布局若需要更宽，再在单独变更中调整并补规格。

## Migration Plan

单次提交完成，无数据迁移。验证顺序：`pnpm --filter desktop check-types` → `pnpm --filter desktop test` → `pnpm --filter desktop lint` / `format` → 开发态启动确认无菜单栏且 DevTools 打开 → `package` 后确认打包态无 DevTools。回滚直接 revert 本次提交。
