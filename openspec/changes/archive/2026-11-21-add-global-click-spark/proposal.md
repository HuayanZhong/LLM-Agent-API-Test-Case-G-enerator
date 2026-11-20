# Proposal: add-global-click-spark

## Why

前端目前只有表单校验与 Toast 反馈,点击交互缺少视觉反馈层次,整体质感偏"表单演示"。React Bits 的 ClickSpark(点击迸发火花)能以零运行时依赖、纯 DOM 渲染的方式为全站点击增加动效反馈,是低成本、高观感收益的交互提升;shadcn CLI 已内置 `@react-bits` 社区 registry,可按既有组件流程引入。

## What Changes

- 通过 `pnpm dlx shadcn@latest add @react-bits/ClickSpark-TS-TW -c apps/frontend` 引入 ClickSpark 的 TypeScript + Tailwind 变体,组件按仓库约定落入 `packages/ui`(CLI 以 app 为目标,组件写共享包)。
- 新增薄适配层 `ClickSparkProvider`("use client"),挂在根 `app/layout.tsx`,全站生效(登录、注册及未来页面):火花层 `position: fixed`、`pointer-events: none`、置顶 z-index,只画特效不拦截点击。
- 默认配置采用用户调定的参数:`sparkCount=9`、`sparkSize=8`、`sparkRadius=14`、`duration=350`、glow 开、`preset=comet`、`easing=spring`、`ring=true`、`shape=star`、`sparkWidth=1.5`、`randomness=0.05`;全部可通过 props 覆盖。
- 火花颜色默认取主题令牌,暗色 / 亮色主题下均可见;若 DOM 渲染不支持 CSS 变量色值,适配层读主题状态换算实际色值。
- 补 `ClickSparkProvider` 渲染冒烟测试(挂载成功、不拦截点击)。
- 按文档同步规则更新根 CLAUDE「已实现」与 frontend 包文档。

不做的事情(本期明确排除):

- 不做可关闭特效的用户设置项(设置面板留待后续)。
- 不做 `prefers-reduced-motion` 之外的动效降级体系;若实现中发现 ClickSpark 与静态导出或双主题冲突,以修复适配层为限,不改组件内部实现。
- 不引入 reactbits 其他动效组件,只做 ClickSpark 一个。

## Capabilities

### New Capabilities

- `global-click-effect`: 全站点击反馈特效的行为规格——特效挂载层级与生效范围、不拦截点击的约束、主题适配、默认参数与可覆盖性。

### Modified Capabilities

(无——`login-page` / `register-page` 的表单行为与验收场景不变,特效是全局能力,不在页面能力内描述。)

## Impact

- **新增代码**:`packages/ui` 内新增 ClickSpark 组件源码(CLI 复制,归仓库所有);`apps/frontend` 新增 `ClickSparkProvider` 适配层与测试。
- **修改文件**:根 `app/layout.tsx`(挂载适配层);根 CLAUDE.md「已实现」列表;frontend 包文档。
- **依赖**:无新增 npm 依赖(ClickSpark 为复制源码型组件);`@react-bits` 仅作为 shadcn registry 拉取源。
- **不影响**:BFF / backend / desktop 运行时;既有页面测试与 95% 行覆盖率门槛(新组件计入门槛,需带测试);`openspec/specs` 既有规格不变。
