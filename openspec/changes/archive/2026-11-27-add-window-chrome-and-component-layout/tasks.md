# Tasks

## 1. 桌面壳窗口 chrome

- [x] 1.1 新增 `apps/desktop/src/app/titlebar.ts`：导出 `TitleBarTheme`（`light | dark`）、`TITLE_BAR_CHANNEL`（`titlebar:set-theme`）、`isTitleBarTheme()`、`getTitleBarOverlay(theme)`（透明底色、浅色 `#0a0a0a` / 深色 `#fafafa`、高度 40）与 `registerTitleBarIpc()`；IPC 只接受白名单主题，取不到现存窗口或参数非法时忽略。
- [x] 1.2 修改 `getWindowOptions()`：`win32` 下增加 `titleBarStyle: "hidden"` 与 `titleBarOverlay`，初始符号色取 `nativeTheme.shouldUseDarkColors`；非 Windows 保持默认；`title` 保留给任务栏与 Alt-Tab。
- [x] 1.3 `bootstrap()` 在 `app.whenReady()` 后注册标题栏 IPC；主题变化只对 `BrowserWindow.fromWebContents()` 得到的现存窗口调用 `setTitleBarOverlay()`，非 `win32` 或窗口已销毁时直接忽略，不创建新窗口、不打开 DevTools。
- [x] 1.4 `preload.ts` 增加 `setTitleBarTheme(theme)`，内部只调用 `ipcRenderer.send(TITLE_BAR_CHANNEL, theme)`；`packages/types` 的 `DesktopBridge` 增加同名字段并只导出类型。
- [x] 1.5 新增 `apps/desktop/__tests__/titlebar.test.ts`，更新 `bootstrap.test.ts` 与 `preload.test.ts`：覆盖两套配色、平台分支、IPC 注册、非法主题忽略、preload 转发与暴露键列表；行覆盖率不低于 95%。

## 2. 前端全局标题栏

- [x] 2.1 在 `packages/ui/src/styles/globals.css` 的 `:root` 增加 `--app-titlebar-height: 40px`，与主进程 overlay 高度对齐；不随 `--app-font-scale` 缩放。
- [x] 2.2 新增 `apps/frontend/src/components/layout/app-titlebar.tsx`：客户端组件，`fixed inset-x-0 top-0 z-50`、高度取 `var(--app-titlebar-height)`、透明背景、整条 `-webkit-app-region: drag`；右侧 `pr-36` 预留系统按钮区；不绘制产品名、图标或标题文字。
- [x] 2.3 在标题栏内放入语言与主题切换钮，容器与按钮自身都使用 `-webkit-app-region: no-drag`；控件高度固定 `var(--app-titlebar-control-size)`，不随根字号缩放；组件内部监听 `resolvedTheme`，变化时调用 `window.desktop?.setTitleBarTheme?.()`，浏览器预览下静默跳过。
- [x] 2.4 在 `apps/frontend/src/app/layout.tsx` 的 `ThemeProvider` 与 `LocaleProvider` 之内挂载标题栏；删除 `(auth)/layout.tsx` 中 `fixed top-4 right-4` 的切换钮块与对应 import，避免重复入口；检查 Sonner Toast 是否与标题栏重叠，必要时给 `Toaster` 增加顶部偏移。
- [x] 2.5 新增 `apps/frontend/__tests__/app-titlebar.test.tsx`：覆盖两个切换钮、无标题/图标、drag 与 no-drag、主题同步调用、无 `window.desktop` 容错；更新 `auth-layout.test.tsx`，入口断言移入标题栏测试。

## 3. 组件分类

- [x] 3.1 新建 `src/components/layout/`，移入 `theme-provider.tsx`、`locale-provider.tsx`、`click-spark-provider.tsx` 与新增的 `app-titlebar.tsx`；新建 `src/components/controls/`，移入 `theme-toggle.tsx`、`locale-toggle.tsx`。
- [x] 3.2 新建 `(auth)/_components/brand/`、`forms/`、`fields/`，把 9 个认证私有组件按 `brand`（品牌栏、产品标识、扫描背景）、`forms`（登录/注册表单）、`fields`（邮箱/密码/验证码字段）归位。
- [x] 3.3 同步所有相对 import、`@/components/...` 路径与测试 `vi.mock()` 路径；保持 `@/*` 指向 `./src/*` 不变。
- [x] 3.4 确认依赖方向：`layout` 可以组合 `controls`；`controls` 不得 import 布局组合或窗口 chrome，但可以使用 `layout` 的共享上下文 hook（语言偏好）；三个 Provider 互不依赖；认证私有组件继续用相对路径，不提升到全局 `components/`。
- [x] 3.5 运行 `no-arbitrary-px.test.ts` 与 `no-hardcoded-copy.test.ts`，确认递归扫描覆盖新目录且无新增违规。

## 4. 测试与覆盖率

- [x] 4.1 更新前端现有测试的导入路径与 mock 目标；标题栏相关断言改为 `data-testid` 或可访问名称，不依赖旧 fixed 位置。
- [x] 4.2 运行 `pnpm --filter frontend test` 与 `pnpm --filter desktop test`，两个包行覆盖率均不低于 95%。
- [x] 4.3 运行 `pnpm --filter frontend check-types`、`pnpm --filter desktop check-types`、`pnpm check-types`，退出码 0。

## 5. 文档与变更记录

- [x] 5.1 更新 `apps/desktop/README.md` / `CLAUDE.md` / `AGENTS.md`：WCO 方案、Windows 11 前提、`titlebar:set-theme` 通道、透明 overlay 与回退策略、窗口标题不随语言同步的已知限制。
- [x] 5.2 更新 `apps/frontend/README.md` / `CLAUDE.md` / `AGENTS.md`：新的 `components/layout` 与 `components/controls` 分层、认证私有目录、标题栏挂载位置、`no-drag` 规则与后续页面顶部间距约定。
- [x] 5.3 更新 `packages/types/README.md` / `CLAUDE.md`：`DesktopBridge` 新增 `setTitleBarTheme`，仍只允许类型导出。
- [x] 5.4 更新根 `README.md` / `CLAUDE.md` / `AGENTS.md`：桌面壳窗口头部描述与 preload 暴露接口；如目录树或包职责未变，只改相关句子。
- [x] 5.5 更新 `doc/ui-design.md`：工具区从页面右上角改为窗口标题栏、系统按钮左侧；组件路径表同步新目录。
- [x] 5.6 同步 `openspec/config.yaml` 的 `context`：WCO、窄 IPC、组件分层与新目录。
- [x] 5.7 添加 changeset，说明桌面窗口 chrome 与前端组件分层。

## 6. 验证

- [x] 6.1 运行 `pnpm --filter desktop lint`、`format`、`test`、`check-types`，全部退出码 0。
- [x] 6.2 运行 `pnpm --filter frontend lint`、`format`、`test`、`check-types`、`build`，全部退出码 0，且 `out/login/index.html`、`out/register/index.html` 仍生成。
- [ ] 6.3 开发态启动 `pnpm --filter frontend dev` 与 `pnpm --filter desktop dev`：确认窗口顶部无标题文字与图标、系统三个按钮可用、标题栏透明且左右两栏背景无接缝、语言/主题钮位于系统按钮左侧且可点击。
- [ ] 6.4 真机验证拖拽、双击最大化、Snap Layouts、800×600 最小尺寸，以及浅色/深色切换后系统按钮符号色同步。
- [ ] 6.5 打包验证：`pnpm --filter frontend build` 后 `pnpm --filter desktop make`，运行未打包目录确认生产态 `app://` 下标题栏与主题同步同样生效；不打开 DevTools。
- [x] 6.6 运行 `pnpm sherif` 与 `pnpm knip`，确认无新增死依赖、死文件与死导出。
- [x] 6.7 权限恢复后运行 `pnpm exec openspec validate --all` 与 `openspec status --change add-window-chrome-and-component-layout`，确认规格与任务结构有效。
