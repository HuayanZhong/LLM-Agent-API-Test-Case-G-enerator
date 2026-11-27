# 界面样式设计

本文记录 `apps/frontend` 认证界面的视觉系统与实现约定，是样式事实来源。图纸与架构说明见 [README.md](README.md)，共享 token 的实现见 [globals.css](../packages/ui/src/styles/globals.css)。

## 1. 设计定位

- **桌面优先**：产品交付形态是 Electron 桌面端，窗口按 1280×800 设计，桌面壳当前最小 800×600。窄屏分支代码保留，但不作为当前验收目标。
- **复验台账**：左栏不是营销区，而是一张“验证台账”。VERIFY LOOP、01–04 编号、点线引导与右对齐状态共同表达产品的四步闭环（生成 → 执行 → 比对 → 报告）。
- **单色秩序**：除错误态使用 `destructive` 外，界面只用中性色与透明度层级；强调靠字重、字距、留白与线，而不是彩色块。
- **系统字体**：全部使用 Windows 自带字体，离线可用；不引入 Google Fonts 或任何 webfont。
- **克制动效**：扫描线是背景底纹，点击火花是全局点缀；两者都不抢内容，不改变阅读顺序。

## 2. 色彩系统

所有颜色都是语义 token，定义在 `globals.css` 的 `:root` 与 `.dark` 中，组件不得写 `bg-blue-500` 之类的原始颜色。

| Token | 浅色 | 深色 | 用途 |
|---|---|---|---|
| `--background` | `oklch(1 0 0)` | `oklch(0.145 0 0)` | 页面底色 |
| `--foreground` | `oklch(0.145 0 0)` | `oklch(0.985 0 0)` | 主文字 |
| `--muted-foreground` | `oklch(0.556 0 0)` | `oklch(0.708 0 0)` | 辅助文字、说明、状态 |
| `--border` | `oklch(0.922 0 0)` | `oklch(1 0 0 / 10%)` | 分隔线、输入框 |
| `--sidebar` | `oklch(0.985 0 0)` | `oklch(0.205 0 0)` | 品牌栏底色 |
| `--primary` | `oklch(0.205 0 0)` | `oklch(0.922 0 0)` | 主按钮；深色下反相 |
| `--destructive` | `oklch(0.577 0.245 27.325)` | `oklch(0.704 0.191 22.216)` | 只用于错误 |

层级规则：

- 大面积底色只允许 `background` / `sidebar` / `popover`。
- 次级信息用 `muted-foreground`；不要在同一行混用三种以上灰阶。
- 分隔用 `border` 或 `foreground` 的透明度（如 `border-foreground/20`）；阴影只保留 shadcn popover 的默认值，不额外叠加。
- 错误只出现在字段下方与 Toast，不把整页染红。

## 3. 字体系统

四个角色，全部是系统字体栈：

| Token | 字体栈 | 使用位置 |
|---|---|---|
| `--font-sans` | Segoe UI Variable Text → Segoe UI → Microsoft YaHei UI → 雅黑 → PingFang | 正文、表单、按钮、菜单 |
| `--font-title` | DengXian Light / 等线 Light → 等线 → 微软雅黑 UI Light | 中文题头、引语、登录/注册 h1 |
| `--font-label` | Bahnschrift → Segoe UI Variable Display | 拉丁眉标、01–04 编号、语言代码 |
| `--font-mono` | Cascadia Mono → Consolas | 步骤状态、版本号、闭环回落说明 |

排版规则：

- 页面主标题只属于表单：`h1` 用 `font-title text-2xl leading-tight tracking-tight sm:text-3xl`。
- 品牌主张用 `p` 而不是 `h2`：`font-title text-3xl leading-snug xl:text-4xl`；完整版按 `titleLine1` / `titleLine2` 两个文案键固定两行，中英各自断在语义停顿处，不在组件里按语言写 `<br>` 分支。md 窄栏改用一行紧凑版 `text-xl`。
- 眉标与编号：`font-label text-xs tracking-widest`；状态与版本：`font-mono text-xs tracking-wider`。
- 产品名与副标题是一个锁定组合：名称 `text-sm leading-tight font-semibold tracking-tight xl:text-base`，副标题 `mt-1 text-xs leading-none tracking-widest text-muted-foreground`。
- 中文题头按语义固定断行；英文断点由两个文案键决定，不在组件里做语言判断。

### 全局字号缩放

`--app-font-scale: clamp(16px, 1vw, 20px)` 设在 `html` 上：

- 视口 ≤ 1600px 时保持 16px；
- 1600–2000px 之间按 `1vw` 线性增长；
- ≥ 2000px 后封顶 20px（2560px 下仍是 20px）；
- 所有 rem 尺寸随之等比放大，避免在超大屏逐档写 `3xl:` 或 `min-[...]`。

## 4. 布局与栅格

认证布局是两级、两栏：

```
md (768–1023)：grid-cols-[2fr_3fr]   窄品牌栏 + 表单
lg (1024+)    ：grid-cols-2           完整品牌栏 + 表单
```

- 根容器 `min-h-svh grid-rows-1`，唯一一行撑满高度，避免大屏底部出现背景空白带。
- 品牌栏 `overflow-y-auto`，内容列 `max-w-md xl:max-w-lg`，水平居中、垂直居中；引语紧随轨道，不钉在视口底部。
- 表单列 `max-w-sm xl:max-w-md`，整体居中；不随视口变宽无限拉伸。
- 全局标题栏固定一个工具区：语言 → 主题，位于窗口顶部右侧、系统窗口按钮左侧；标题栏透明、无标题与图标，高度 `--app-titlebar-height`（40px，与 WCO 对齐），控件高度固定 `--app-titlebar-control-size`（32px），不随根字号缩放；浏览器预览时退化为视口右上角区域。
- 桌面宽度下不要求页面滚动；表单控件不被裁切，也不出现横向溢出。

## 5. 品牌区

### 5.1 产品标记

`product-mark.tsx`：半透明底片 + 三条横线。

- 底片：`rounded-lg bg-foreground/10`，`px-2.5`；基础尺寸 `size-9`，桌面左栏用 `size-9 xl:size-10`，窄屏分支用 `size-8 sm:size-9`。
- 三条线：`h-0.5`，透明度 90 / 65 / 40；第三条宽度 `2/3`。
- 三条线对应请求、比对与报告；半透明底片保留轮廓但不抢标题。
- 标记是纯装饰，`aria-hidden="true"`；产品名由旁边文字承担。

### 5.2 标识组合

`product-masthead.tsx` 是桌面左栏与移动端分支共用的唯一实现，避免两处比例漂移。桌面标记 `size-9 xl:size-10`，窄屏分支 `size-8 sm:size-9`。

### 5.3 台账结构

- 眉标行：`t("brand.eyebrow")` + 一条 `h-px` 延伸线 + `t("brand.range")`（范围由步数与编号宽度推导，不写字面 01—04），像报告页栏头。
- 题头：两行主张（`titleLine1` / `titleLine2`，中英各自成句）；md 窄栏用一行紧凑版 `text-xl`，lg 起才展开完整版。
- 说明：一句产品闭环描述，`text-sm leading-6 xl:text-base xl:leading-7`。
- 四步轨道：左侧 `border-l border-foreground/20`，每步一个 `size-2` 圆点、`01`–`04` 编号、标题、点线引导、右对齐状态。
- 回落边：`↺ 不一致时重放复现`，说明闭环回退，不新增第五步。
- 红线引语：`font-title border-l-2 border-foreground/25`。
- 页脚：`t("brand.footerNote")` 与 `t("brand.version", { version })`（版本号来自 `package.json`），`font-mono` 分列两端。

编号与点线不是装饰：四步是真实顺序，编号是规格的一部分；不要在没有顺序的内容上套 01/02/03。

## 6. 背景与动效

### 6.1 扫描线背景

`scanner-backdrop.tsx` 适配 ReactBits Scanner（WebGL）：

- 灰度双主题：深色 `#3f3f46 / #a1a1aa / #f4f4f5`，浅色 `#a1a1aa / #52525b / #18181b`。
- 低强度：`opacity 0.45`、`brightness 0.7`、`vignette 0.45`、`glow 0.3`、`lineWidth 0.7`。
- 绝对铺满、`pointer-events-none`、`aria-hidden`，再叠 `blur-xs`（4px）。
- 内容层始终 `relative` 压在背景之上；扫描线只做底纹，不参与信息表达。

### 6.2 点击火花

`click-spark-provider.tsx` 挂在根布局：

- 9 个星形火花、8px、350ms、spring 缓动、随机度 0.05。
- 颜色由 `spark-color.ts` 解析主题 `--primary` / `--foreground` 令牌，随 `resolvedTheme` 切换。
- 绘制在内容之上但不拦截点击；它不是交互反馈，不承担状态表达。

## 7. 组件与交互

### 7.1 表单

- 字段：`space-y-2`；标签在上，输入框 `h-8`；错误在下方 `text-sm text-destructive`。
- `aria-invalid` 与 `aria-describedby` 必须与错误文本关联。
- 密码显隐按钮必须 `type="button"`，只切换呈现，不改值。
- 提交按钮满宽，提交中禁用并显示加载图标；重复提交在逻辑层再挡一次。

### 7.2 语言切换

`locale-toggle.tsx` 使用 shadcn `DropdownMenu`：

- 触发器：地球图标 + 当前语言代码（中 / EN）+ 下箭头；`h-8`，与主题按钮 `size-8` 同高（默认字号下 32px）。
- 文本 `text-foreground/80`，悬停回到 `foreground`；箭头展开时旋转 180°。
- 菜单：`DropdownMenuRadioGroup` + `RadioItem`；语言名来自 `@workspace/i18n` 的 `LOCALE_META`（母语写法，不随界面语言翻译）；`LOCALE_META` 属于语言元数据，不进 `messages` 词表。
- 选中项：淡 `accent/60` 底 + 中等字重 + 右侧勾选。
- 可读名称包含当前语言：`切换语言: 中文` / `Switch language: English`。
- 切换只改文案与偏好，不改 URL；偏好写 `interface-test-agent:locale`。

选择文本而不是国旗：工具类桌面应用用国旗会引入地域歧义，也与整套台账视觉冲突。

### 7.3 主题与 Toast

- 主题：`next-themes` 的 class 策略，默认跟随系统；切换时禁用 CSS 过渡，避免整页渐变闪烁。
- 唯一入口：窗口标题栏里的可见按钮；不注册全局快捷键。深浅色切换时通过 `window.desktop.setTitleBarTheme` 同步系统按钮符号色。
- Toast：`sonner` 组件保持 CLI 默认，`top-center`，顶部偏移让出标题栏高度；类型由默认图标区分，不做颜色或图标覆盖。桌面宽度下与标题栏工具区不重叠。

### 7.4 图标

- 只使用 `lucide-react`；尺寸 `size-4` 为主，次级箭头 `size-3.5`。
- 图标是辅助，按钮必须有可读名称；纯装饰图标 `aria-hidden="true"`。

## 8. 可访问性

- 每个输入有显式 `Label`；错误通过 `aria-describedby` 关联。
- 所有操作可用键盘完成，焦点样式来自 `ring` token。
- 语言菜单使用 Radix 的 radio 语义，键盘可打开、选择并回焦触发器。
- `LocaleProvider` 同步 `<html lang>`、`document.title` 与 `meta[name="description"]`；静态 HTML 初始为 zh-CN。
- 装饰性标记、背景与火花全部 `aria-hidden` 或 `pointer-events-none`。
- 浅色下 `muted-foreground` 约 4.7:1，达到 AA；语言触发器提高到 `foreground/80`，避免“像禁用态”。

## 9. 约定与红线

- 文案只能来自 `@workspace/i18n`；组件不写中英文字面量，包括眉标与页脚这类结构性标签。
- 页面 `metadata` 的标题与描述从 `messages[DEFAULT_LOCALE]` 取，不在页面文件里重复写一份。
- 语言自身的显示名（中 / EN、中文 / English）属于语言元数据，放在 `LOCALE_META`，不进 `messages`。
- 颜色只用语义 token；不写原始色值。
- 尺寸优先用 Tailwind 比例与间距 token；禁止 `text-[10px]` 这类任意值。
- 源码里不要写 px：根字号靠 `--app-font-scale` 缩放，只有 rem 尺寸会一起放大，任意 px 会把该处钉死。发丝线用 `h-px`，其余一律用 Tailwind 令牌；`__tests__/no-arbitrary-px.test.ts` 会扫描 `src/` 并拦截。
- 唯一允许 px 的位置是 `globals.css` 的 `--app-font-scale: clamp(16px, 1vw, 20px)`、`--app-titlebar-height: 40px` 与 `--app-titlebar-control-size: 32px`——前者是缩放锚点，后两者是必须与 OS 窗口 chrome 对齐的固定尺寸。
- 不使用 `next/font/google` 或任何 webfont。
- 不手工新建 shadcn 组件；组件由 CLI 拉入 `packages/ui`，本包只保留适配层。
- 不改 registry 组件内部逻辑，只做必要的严格模式修复。
- 风格改动同步更新本文件与 `apps/frontend/CLAUDE.md`；行为变化走 OpenSpec。
- 例外（尚未纳入词表）：Electron 主进程的窗口标题常量与开发态诊断页仍是中文硬编码。它们运行在无 React 的主进程、且本包保持零运行时依赖，跟随界面语言需要另立 IPC 变更。

## 10. 文件索引

| 文件 | 职责 |
|---|---|
| `packages/ui/src/styles/globals.css` | 字体栈、色彩 token、圆角、全局字号缩放 |
| `apps/frontend/src/app/layout.tsx` | 根布局、Provider、全局标题栏、点击火花 |
| `apps/frontend/src/app/(auth)/layout.tsx` | 认证双栏、Toaster（含标题栏偏移） |
| `apps/frontend/src/app/(auth)/_components/brand/login-brand-panel.tsx` | 品牌栏、台账轨道、引语与页脚 |
| `apps/frontend/src/app/(auth)/_components/brand/product-mark.tsx` | 产品几何标记 |
| `apps/frontend/src/app/(auth)/_components/brand/product-masthead.tsx` | 产品名与副标题锁定 |
| `apps/frontend/src/app/(auth)/_components/brand/scanner-backdrop.tsx` | 扫描线背景适配 |
| `apps/frontend/src/components/layout/app-titlebar.tsx` | 全局标题栏、拖拽区与工具入口 |
| `apps/frontend/src/components/controls/locale-toggle.tsx` | 语言下拉 |
| `apps/frontend/src/components/layout/locale-provider.tsx` | 语言偏好、lang / 标题 / 描述同步 |
| `apps/frontend/src/components/layout/theme-provider.tsx` | 主题上下文与持久化 |
| `apps/frontend/src/components/controls/theme-toggle.tsx` | 主题切换 |
| `apps/frontend/src/components/layout/click-spark-provider.tsx` | 点击火花适配 |
| `apps/frontend/src/lib/spark-color.ts` | 主题令牌 → 火花色值 |

## 11. 验证清单

- 1280×900 与 2560×1200 下：无横向溢出，双栏比例正确，标题栏工具区不与系统按钮重叠。
- 桌面壳中：标题栏透明、双栏背景无接缝，无标题文字与图标；拖拽与双击最大化可用；切换深浅色后系统按钮符号色同步。
- 浅色与深色：文字、边框、焦点、禁用态均可读；错误色只出现在错误位置。
- 中文与英文：题头、字段、按钮、Toast、倒计时、标题与描述全部随语言切换；表单已填值不丢失。
- 语言切换后刷新：偏好保留；清空偏好后回落中文。
- 键盘：Tab 可到达所有控件；语言菜单可用方向键选择并回焦。
- `pnpm --filter frontend test`、`check-types`、`lint`、`format`、`build` 全部通过。
