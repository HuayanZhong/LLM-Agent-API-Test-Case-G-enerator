# Proposal

## Why

桌面壳目前是「能跑通」的最小实现：主窗口没有最小尺寸约束，默认应用菜单栏仍会显示，开发态也没有打开 DevTools 的入口；`src/` 下入口与实现、类型混在根目录，后续接入 IPC 与进程托管时会继续变散。这一轮把窗口形态、开发调试能力和目录边界一次收敛到位。

## What Changes

- 主窗口增加最小尺寸约束 `minWidth: 1024`、`minHeight: 800`；初始尺寸保持 `1280×800`，`show: false` + `ready-to-show` 不变。
- 移除 Electron 默认应用菜单栏：启动后 `Menu.setApplicationMenu(null)`，窗口不再显示 File / Edit / View / Window / Help。
- 未打包（开发）运行时绑定 F12 与 Ctrl+Shift+I 切换 DevTools，启动时不自动打开；打包运行时不注册快捷键，也不自动打开。
- 重排 `apps/desktop/src/`：`main.ts`、`preload.ts` 保留在根作为 Forge 入口；窗口生命周期归入 `app/`，`app://` 协议归入 `protocol/`，共享类型集中到 `types/`（`types/index.ts` + `types/global.d.ts`）。
- 同步更新包级文档与测试：`apps/desktop/README.md`、`apps/desktop/CLAUDE.md`、以及受移动影响的 `__tests__` 导入路径与覆盖率排除项。
- 不改变：窗口标题、`webPreferences` 安全配置（sandbox / contextIsolation / nodeIntegration）、`app://` 资源解析、单实例锁、导航与权限拦截。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `desktop-shell`: 新增「窗口形态与开发工具」要求，覆盖最小尺寸、菜单栏移除、开发态打开 DevTools、打包态不打开 DevTools。

## Impact

- 代码：`apps/desktop/src/main.ts`、`src/app/bootstrap.ts`、`src/app/config.ts`、`src/app/navigation.ts`、`src/protocol/protocol.ts`、新增 `src/types/index.ts` / `src/types/global.d.ts`。
- 测试：`apps/desktop/__tests__/*.test.ts` 调整导入路径；`bootstrap.test.ts` 补充窗口选项、菜单与 DevTools 断言；`vitest.config.ts` 覆盖率排除类型文件。
- 行为：窗口下限、启动菜单与开发调试面板；不影响页面加载、协议托管与打包产物。
- 依赖：无新增；仍使用 Electron 内置 `Menu` 模块。
- 文档：`apps/desktop/README.md`、`apps/desktop/CLAUDE.md` 的目录与验证章节需同步。
