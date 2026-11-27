# Design

## Context

`apps/desktop` 是 Electron 45 + Forge 8 的 Windows x64 桌面壳，`getWindowOptions()` 目前只设置尺寸、标题与安全 `webPreferences`，窗口由 Windows 原生标题栏绘制；`preload.ts` 只暴露 `platform` 与 `versions`，`DesktopBridge` 契约在 `packages/types`。开发态加载 3000，生产态通过 `app://bundle/` 托管 `apps/frontend/out`。

前端是 Next.js 16 App Router + `output: "export"`。根 layout 挂三个全局 Provider（主题、语言、点击火花）；认证布局 `(auth)/layout.tsx` 在右上角用 `fixed top-4 right-4` 绘制语言与主题切换钮。全局组件在 `src/components/` 平铺，认证私有组件在 `src/app/(auth)/_components/` 平铺。主题令牌在 `packages/ui/src/styles/globals.css`，根字号由 `--app-font-scale` 缩放；前端 `__tests__/no-arbitrary-px.test.ts` 与 `no-hardcoded-copy.test.ts` 递归扫描 `src/`。

当前 Windows 版本为 Windows 11，交付形态只有 Windows x64 ZIP。

## Goals / Non-Goals

**Goals:**

- Windows 窗口头部使用 WCO：保留系统最小化、最大化、关闭，去掉标题文字与图标，背景透明并融入页面。
- 全局标题栏提供语言与主题入口，位于系统按钮左侧，浏览器预览下同样可用。
- 深浅色主题切换时，系统按钮符号色同步变化；只新增一条窄 IPC。
- 组件按职责分层，行为、URL 与静态导出路径不变。

**Non-Goals:**

- 自绘最小化/最大化/关闭按钮。
- macOS traffic lights、Linux 标题栏适配。
- `packages/ui/src/components` 目录重排；共享组件继续由 shadcn CLI 管理。
- 窗口标题跟随界面语言（现有已知限制）。
- 无边框窗口的圆角、阴影、透明磨砂等额外定制。

## Decisions

### 1. 使用 Windows 11 WCO，而不是自绘窗口按钮

`BrowserWindow` 在 `win32` 下设置 `titleBarStyle: "hidden"` 与 `titleBarOverlay`，由系统绘制三个窗口按钮。这样保留系统 Snap Layouts、双击最大化、窗口菜单与键盘可达性，页面只需要让出右侧按钮区并绘制拖拽区。

- **备选：`frame: false` + 自绘按钮**。视觉完全可控，但要自己实现最小化/最大化/关闭、悬停态、Snap Layouts 与键盘行为，和本次「保留系统按钮」的要求相反。
- **备选：保留原生标题栏，只加页面内头部**。改动最小，但用户明确否定了系统标题栏与页面的割裂感。
- **平台范围**：只在 `win32` 启用；其他平台保持默认窗口，避免在未验证的 macOS/Linux 上引入回归。

### 2. overlay 背景透明，符号色随主题

`titleBarOverlay` 的 `color` 设为 `rgba(0, 0, 0, 0)`，让页面背景从标题栏区域直接透出。认证页左侧是 `bg-sidebar`、右侧是 `bg-background`，单色 overlay 无法同时匹配两栏，透明是避免顶部接缝的唯一简单做法。Windows 11 支持透明 overlay；若真机实测不支持，回退为按主题给 overlay 上不透明底色，并在设计记录中注明左栏接缝的后续处理。注意：`#00000000` 这种 8 位十六进制在 Electron 的原生颜色解析里会被当成不透明黑色，必须用 `rgba(0, 0, 0, 0)`。

`symbolColor` 取主题前景色：浅色 `#0a0a0a`、深色 `#fafafa`，对应 `--foreground` 的 `oklch(0.145 0 0)` / `oklch(0.985 0 0)`。窗口创建时用 `nativeTheme.shouldUseDarkColors` 取初始值，避免首帧按钮颜色跳变；页面加载后由渲染进程按实际应用主题纠正。

`height` 固定 40；前端标题栏使用同名 CSS token `--app-titlebar-height: 40px`，确保 OS 按钮区与页面拖拽区同高。

- **备选：固定浅色或固定深色**。实现更简单，但会在另一主题下形成明显亮带或暗带，违背「融进背景」的目标。
- **备选：完全透明且不更新符号色**。深色页面上按钮会不可见或对比不足。

### 3. 一条窄 IPC，只传主题枚举

新增常量通道 `titlebar:set-theme`。`preload.ts` 增加 `setTitleBarTheme(theme)`，内部只调用 `ipcRenderer.send`；主进程校验参数必须是 `light` 或 `dark`，在 `win32` 且窗口仍存在时才按固定映射更新 `win.setTitleBarOverlay({ symbolColor })`。不接受渲染进程传入任意颜色、尺寸或路径，避免把 CSS 或原生窗口配置变成可注入面。

`DesktopBridge` 增加 `setTitleBarTheme: (theme: "light" | "dark") => void`；前端调用时用 `window.desktop?.setTitleBarTheme?.()`，浏览器预览下静默跳过。前端在 `src/types/global.d.ts` 把 `Window.desktop` 声明为可选，契约仍从 `@workspace/types` 引入，避免在浏览器侧假设宿主一定存在。

- **备选：暴露通用 `setTitleBarOverlay(options)`**。灵活但把原生窗口配置开放给渲染进程，违背 preload 最小接口边界。
- **备选：主进程监听 `nativeTheme` 自动更新**。只能跟随系统主题，无法跟随应用内手动切换；应用主题是 `next-themes` 的独立状态。

### 4. 全局标题栏：无标题、无图标、透明覆盖

新增 `src/components/layout/app-titlebar.tsx`，挂在根 layout 的 `ThemeProvider` 与 `LocaleProvider` 之内（切换钮分别依赖主题与语言上下文）：

- `fixed inset-x-0 top-0 z-50`，高度取 `--app-titlebar-height`，背景透明；
- 整条 `-webkit-app-region: drag`，可拖动窗口、双击最大化；
- 右侧 `pr-36`（9rem）为系统按钮留位；语言/主题钮放在 `-webkit-app-region: no-drag` 的容器里，避免拖拽吞点击；
- 不绘制产品名、图标或标题文字；`BrowserWindow.title` 仍保留，供任务栏与 Alt-Tab 使用；
- 认证布局删除原来的 `fixed top-4 right-4` 切换钮块，避免两套入口。

不加占位条：页面背景继续延伸到窗口顶部，透明 overlay 才能无缝。后续工作台页面若顶部有可点击内容，需要自行加顶部间距；这一点写进前端包级规则。

浏览器预览没有桌面壳时，标题栏仍然渲染，只是右侧没有系统按钮，预留的空白由页面背景填充，开关功能不受影响。

### 5. 标题栏高度不随根字号缩放

`--app-titlebar-height: 40px` 定义在 `packages/ui/src/styles/globals.css`，与主进程的 `titleBarOverlay.height` 对齐。窗口 chrome 是 OS 尺寸，不能跟随 `--app-font-scale` 等比放大，否则系统按钮与拖拽区会错位。前端源码的 no-px 扫描只覆盖 `apps/frontend/src`，该 token 与现有的 `--app-font-scale` 一样放在 UI 样式表里。

- **备选：用 `h-10` / `rem`**。根字号在大屏上升到 20px 时高度变成 50px，与系统按钮区错位。
- **备选：读取 `env(titlebar-area-height)`**。Windows 下的可用性不稳定，且我们已显式设置 overlay 高度，直接使用同名 token 更可预测。

### 6. 组件按职责分层

目录调整只改路径，不改行为：

```
apps/frontend/src/components/
  layout/     theme-provider、locale-provider、click-spark-provider、app-titlebar
  controls/   theme-toggle、locale-toggle

apps/frontend/src/app/(auth)/_components/
  brand/      login-brand-panel、product-mark、product-masthead、scanner-backdrop
  forms/      login-form、register-form
  fields/     email-field、password-field、code-field
```

依赖方向固定为 `layout → controls`：布局层可以组合控件；控件不得 import 布局组合或窗口 chrome，但可以使用 `layout/` 中的共享上下文 hook（语言切换需要 `useLocalePreference`）。Provider 之间互不依赖。认证私有组件继续用相对路径，不提升到全局 `components/`。`packages/ui/src/components` 保持 CLI 落盘的平铺结构，不做手工搬家，避免和 `components.json` 与 `exports` 冲突。

- **备选：把根布局级文件移到 `src/app/_components/`**。更贴近 Next 路由私有目录，但全局 Provider 与窗口 chrome 会被绑定到某个路由树；当前没有多布局需求，先用 `src/components/layout`。
- **备选：把三个 Provider 归到 `providers/`**。更贴近技术角色，但用户希望把「布局级」单独成层；`layout/` 同时容纳 Provider 与标题栏，边界更容易解释。

### 7. 测试策略

- 桌面壳：`titlebar.ts` 的纯函数覆盖两套配色与参数校验；`getWindowOptions` 在 `win32` 下包含 hidden/overlay；bootstrap 注册 IPC、忽略非法主题、只对现存窗口更新；preload 暴露键列表与转发调用。
- 前端：AppTitlebar 渲染两个切换钮、无标题文案、drag/no-drag 类、主题同步调用、无 desktop 容错；认证布局测试只验品牌栏、表单与 Toast，入口断言移到标题栏测试。
- 目录重排后，现有 import 与 mock 路径同步更新；两个源码扫描测试递归覆盖新目录。
- 真机验证透明 overlay、拖拽、双击最大化、Snap Layouts 与主题同步，单测不能替代。

## Risks / Trade-offs

- **透明 overlay 在 Windows 10 或个别显卡驱动下可能不生效** → 以 Windows 11 真机为准；若不生效，回退为按主题上不透明底色，并记录左栏接缝。
- **顶部 40px 拖拽区吞掉点击** → 只有切换钮与可交互元素使用 `no-drag`；页面顶部若有新控件，必须显式加 `no-drag`。
- **固定标题栏覆盖页面顶部** → 现有认证页顶部是内边距与居中内容，不受影响；后续工作台页面的顶部间距写入前端规则。
- **首帧按钮颜色与应用主题不一致** → 用 `nativeTheme` 取初始值，页面挂载后立即纠正；可接受一次极短过渡。
- **组件搬家造成 import 与测试路径遗漏** → `check-types`、`test`、两个扫描测试与构建一起兜底。
- **规格与实现的窗口最小尺寸早已漂移（规格 1024×800、实现 800×600）** → 本次触达窗口选项，顺带把规格改为 800×600，与代码和包级文档一致。

## Migration Plan

1. 桌面壳：新增 `titlebar.ts`、修改窗口选项、注册 IPC、扩展 preload 与 `DesktopBridge`，补单测。
2. 前端：在 UI 全局样式加高度 token，新增 `app-titlebar`，挂根 layout，移除认证布局入口，接入主题同步。
3. 组件重排：先建 `layout/`、`controls/`、`brand/`、`forms/`、`fields/`，移动文件并同步 import、mock 与测试。
4. 文档与 changeset：包级三份文件、根级三份文件、`openspec/config.yaml`，运行 `check-types`、`test`、`lint`、`format`、`build` 与桌面真机验证。

回滚策略：不涉及数据与外部服务；还原相关提交即可。语言与主题偏好仍在本地存储中，旧布局会忽略新增的标题栏接口。

## Open Questions

- Windows 11 真机透明 overlay 是否稳定；若不稳定，回退配色方案在实现阶段定稿。
- 后续工作台页面顶部内边距是否抽成共享 token，留到工作台变更再决定。
- 窗口标题是否跟随界面语言，维持现有已知限制，另立变更。
