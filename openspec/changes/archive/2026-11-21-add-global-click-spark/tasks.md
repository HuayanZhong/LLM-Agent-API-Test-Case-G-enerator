# Tasks

## 1. 组件引入

- [x] 1.1 执行 `pnpm dlx shadcn@latest add @react-bits/ClickSpark-TS-TW -c apps/frontend`,确认组件源码落到 `packages/ui`(`@workspace/ui/components`)且无 npm 依赖新增;`pnpm check-types` 退出码 0
- [x] 1.2 审查 CLI 写入的组件文件:确认 'use client'、canvas 渲染、props 与 design D5 参数集对得上;确认 oxlint / oxfmt 对新文件通过(`pnpm --filter @workspace/ui lint` / `format` 退出码 0),不通过则以最小改动适配

## 2. 适配层实现

- [x] 2.1 实现 `apps/frontend/src/components/click-spark-provider.tsx`:"use client"、固定 `layer="front"`、默认参数集、children 透传;对应测试:挂载成功、children 正常渲染、未传 props 时以默认参数集生效、显式传参覆盖对应默认项,`pnpm --filter frontend test` 通过
- [x] 2.2 实现主题色解析:经 next-themes `useTheme().resolvedTheme` 就绪后用 `getComputedStyle` 读主题令牌为实际色值传 `sparkColor`,主题切换即时跟随;对应测试:resolvedTheme 变化后重新解析色值(mock getComputedStyle),jsdom 下 stub canvas getContext 最小实现,`pnpm --filter frontend test` 通过
- [x] 2.3 不拦截交互验证:点击按钮 / 输入框时其自身回调正常触发且出现火花调用;对应测试:jsdom 派发 click 后按钮 onClick 与输入框 focus 均正常,`pnpm --filter frontend test` 通过

## 3. 挂载与回归

- [x] 3.1 根 `app/layout.tsx` 挂载 `ClickSparkProvider` 包住 children;`pnpm --filter frontend build`(静态导出)退出码 0,确认无 SSR / 水合错误
- [x] 3.2 浏览器实测:chrome-devtools MCP 打开 `/login/` 与 `/register/`,暗色 / 亮色主题各点击验证火花呈现与交互不受扰;若 comet 观感与预期有出入,按 design D5 微调默认参数
- [x] 3.3 覆盖率门槛验证:`pnpm --filter frontend test` 行覆盖率 ≥ 95%;若 CLI 组件源码拖累门槛,按 design D6 将其加入 coverage exclude 并在包文档注明

## 4. 文档同步

- [x] 4.1 根 `CLAUDE.md`「已实现」列表补全局点击特效一句;`apps/frontend/README.md` / `CLAUDE.md` 补适配层位置与默认参数说明;`pnpm exec openspec validate --all` 退出码 0
- [x] 4.2 全量验证:`pnpm check-types`、`pnpm test`、`pnpm lint`、`pnpm format` 全部退出码 0

## Workflow follow-up

- 功能 PR 附 changeset(`pnpm changeset`),合并 main 后走 Version Packages PR。
- 人工确认验收后用 `openspec-archive-change` 归档,归档前先 `pnpm exec openspec validate --all`,归档后确认 `openspec/specs/global-click-effect/spec.md` 生成。
