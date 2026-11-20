# Design: add-global-click-spark

## Context

前端是 Next.js 16 静态导出 + React 19 + Tailwind v4,shadcn radix-nova 组件在 `packages/ui`,通过 CLI(`-c apps/frontend`)安装。`app/layout.tsx` 已挂 ThemeProvider(next-themes,`class` 策略)与全局样式。`(auth)` 路由组是当前唯一页面群。前端测试用 Vitest react profile(jsdom + Testing Library),行覆盖率门槛 95%。

React Bits 的 ClickSpark 通过 shadcn CLI 内置的 `@react-bits` 社区 registry 分发;`ClickSpark-TS-TW` 变体的真实实现(已核对 registry 源码)为 **canvas 渲染**:'use client',监听全局点击,每次迸发生成火花在离屏 canvas 上绘制,内置 `MAX_BURSTS=32` 上限与 prefers-reduced-motion 短促模式(320ms)。`sparkColor` 接受 `string | string[]`,经 canvas `fillStyle` 使用——**不支持 CSS 变量**。

## Goals / Non-Goals

**Goals:**

- 一次接入,全站(含未来页面)点击都有火花反馈。
- 特效对交互零干扰:不拦截、不延迟、不吞事件。
- 暗色 / 亮色主题下火花都清晰可见,主题切换即时跟随。
- 全部动效参数可从调用处覆盖,默认值即用户调定的参数集。

**Non-Goals:**

- 不做用户侧开关 / 设置面板。
- 不引入 reactbits 其他动效组件。
- 不修改 ClickSpark 组件内部实现——组件归仓库所有但本期不改,冲突只通过适配层解决。

## Decisions

### D1:变体选 `ClickSpark-TS-TW`

`JS-CSS` 会引入 .jsx 与裸 CSS,不吃 Tailwind 主题令牌、与 TS 仓库混杂;`TS-TW` 与项目语言栈、样式体系完全对齐。安装命令:

```bash
pnpm dlx shadcn@latest add @react-bits/ClickSpark-TS-TW -c apps/frontend
```

### D2:组件落 `packages/ui`,适配层落 `apps/frontend`

CLI 经 `components.json` 的 `ui` alias 把组件写到 `@workspace/ui/components`(既有约定)。`apps/frontend/src/components/click-spark-provider.tsx` 放适配层:应用侧专属的挂载、主题解析、默认参数都属 app 逻辑,不上移到共享包。

### D3:根 layout 挂载,`layer="front"` + fixed 置顶

`ClickSparkProvider`("use client")包住 `layout.tsx` 的 children。组件自带 `layer: 'front' | 'back'` 与定位容器,适配层固定 `layer="front"` 并确保火花层 `position: fixed`、`pointer-events: none`、z-index 高于页面内容——只绘制,不接收事件。

### D4:颜色解析——适配层读计算样式,不传 CSS 变量

canvas `fillStyle` 不解析 `var(--foreground)`,且 Chrome 会把令牌值规范化为 `lab()`,组件内 `channels()` 的正则只认 hex / rgb——适配层把令牌经 1×1 画布填充后取回像素,折算成 rgb() 色值。主题切换的感知不能走 `useTheme().resolvedTheme` 的渲染期读取:next-themes 先改 DOM class 再触发 React 重渲染,渲染期读令牌拿到的是旧主题色值且不会再更新(实测复现)。实现改为监听 `documentElement` 的 class 变更(`MutationObserver`),回调里重解析,同时覆盖手动切换与跟随系统;初始色在 `useState` 惰性初始化时解析(next-themes 内联脚本先行设置 class)。

### D5:默认参数 = 用户调定参数集

适配层默认 props:`sparkCount=9`、`sparkSize=8`、`sparkRadius=14`、`sparkWidth=1.5`、`duration=350`、`easing="spring"`、`shape="star"`、`randomness=0.05`、`glow=1`(开)、`ring=true`、`preset` 彗星风格。注:registry 源码的 props 集里没有独立 `preset` 字段(comet 是 `shape`/`direction`/`spread` 组合出的视觉风格),适配层以 `shape` 等参数复现 comet 观感,若与 demo 有出入以用户实际观感微调为准。所有键原样透传,未传入的回落默认。

### D6:测试——jsdom 下 stub canvas,适配层单独测

jsdom 无 2D canvas 实现,组件测试需 stub `HTMLCanvasElement.prototype.getContext`(返回记录调用的最小 stub)。测试范围:`ClickSparkProvider` 渲染冒烟(挂载成功、children 正常透传)、props 覆盖默认值生效、不拦截点击(点击按钮的事件回调正常触发)。组件内部动效逻辑不改、不测——覆盖门槛压力集中在适配层与既有页面测试。

## Risks / Trade-offs

- [canvas 绘制在低端设备上与 350ms 多次迸发叠加的功耗] → 组件内置 `MAX_BURSTS=32` 与 reduced-motion 短促模式;`disabled` prop 保留为后续设置面板的挂点,本期不接 UI。
- [`getComputedStyle` 在主题类挂载前读到错误色值] → 适配层在 `resolvedTheme` 就绪后解析;初次水合的短暂闪色可接受,不阻塞主流程。
- [95% 行覆盖率门槛 + 组件源码计入 coverage.include] → 若 CLI 组件源码拉高门槛压力,将 ClickSpark 组件文件加入 vitest coverage exclude(仅排除组件内部实现),适配层与页面测试照常计入;在任务中显式验证。
- [comet 观感由参数组合复现,可能与 demo 预览有细微差异] → 实现后用户实测观感,微调默认参数即可,不影响架构。

## Migration Plan

纯新增:删掉 `layout.tsx` 里的 Provider 一行 + 删组件与适配层文件即可回滚,无状态迁移。

## Open Questions

无——挂载层级、颜色策略、参数默认值均已在提案阶段确认。
