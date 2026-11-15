# Tasks

## 1. 目录与类型收敛

- [x] 1.1 新建 `src/app/` 与 `src/protocol/`，把 `bootstrap.ts`、`config.ts`、`navigation.ts` 移入 `app/`，`protocol.ts` 移入 `protocol/`；验证 `pnpm --filter desktop check-types` 在更新导入后通过
- [x] 1.2 新建 `src/types/index.ts` 收纳 `RendererOptions`、`WaitForServerOptions`、`BootstrapOptions`、`ProtocolHandlerOptions`、`WebContentsLike`、`DesktopBridge`，并把 `global.d.ts` 移入 `src/types/`；验证 `pnpm --filter desktop check-types` 通过且 `Window.desktop` 类型仍可用
- [x] 1.3 更新 `__tests__` 的导入路径与 `vitest.config.ts` 的 `coverage.exclude`（增加 `src/types/**`）；验证 `pnpm --filter desktop test` 通过且行覆盖率仍 ≥ 95%
- [x] 1.4 同步 `apps/desktop/README.md` 与 `apps/desktop/CLAUDE.md` 的目录结构章节；验证文档列出的每个路径真实存在

## 2. 窗口形态与开发工具

- [x] 2.1 在 `getWindowOptions` 增加 `minWidth: 1024`、`minHeight: 800`，并在 `bootstrap.test.ts` 断言初始尺寸与最小尺寸；验证测试通过
- [x] 2.2 在 `app.whenReady()` 后调用 `Menu.setApplicationMenu(null)`，并在 `bootstrap.test.ts` 断言调用；验证测试通过
- [x] 2.3 新增 `src/app/devtools.ts`，用 `before-input-event` 响应 F12 与 Ctrl+Shift+I 切换 DevTools；`bootstrap` 仅在 `!isPackaged` 时注册；补 `devtools.test.ts` 与 bootstrap 断言；验证 `pnpm --filter desktop test` 通过
- [x] 2.4 更新 `apps/desktop/README.md` 的调试说明与 `apps/desktop/CLAUDE.md` 的窗口约束/验证章节；验证表述与实现一致、无旧说法残留

## 3. 集成验证

- [x] 3.1 运行 `pnpm --filter frontend dev` 与 `pnpm --filter desktop dev`，确认窗口无应用菜单栏、启动不自动打开 DevTools、按 F12 与 Ctrl+Shift+I 可切换、窗口无法缩到小于 1024×800
- [x] 3.2 运行 `pnpm --filter desktop package` 后启动未打包目录，确认无菜单栏、DevTools 未打开且快捷键不生效
- [x] 3.3 运行 `pnpm --filter desktop check-types`、`pnpm --filter desktop lint`、`pnpm --filter desktop format`，确认退出码均为 0

## Workflow follow-up

- 归档前运行 `pnpm exec openspec validate --all`。
- 人工确认实现与验收结果后，再归档本次变更。
