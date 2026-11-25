# Proposal

## Why

当前前端所有用户可见文案都硬编码在组件里，登录、注册、品牌栏、字段提示与 Toast 分散在不同文件中；新增一种语言必须逐文件改动，且没有统一的文案词表。项目是中文产品，但毕业设计需要展示可切换的中英界面，现有结构无法在不改业务代码的前提下做到。

## What Changes

- 引入 `next-intl`，采用纯客户端模式：不启用 `[locale]` 路由、不使用 middleware、不改变现有 URL。
- 新建共享 workspace 包 `@workspace/i18n`，在其中维护中英双语文案目录（zh-CN 为默认语言，en-US 为第二语言），按命名空间组织；消息文件为唯一文案来源，前端通过 workspace 依赖引用。
- 新增语言 Provider 与语言切换组件：语言偏好持久化到本地存储，切换后同步 `<html lang>`；切换组件与现有主题按钮并排放在认证页右上角。
- 迁移认证页、品牌栏、字段标签与占位符、Toast、表单级错误、可访问性标签与页面标题中的硬编码中文到文案键。
- 校验函数改为返回错误键（含插值参数），不再直接返回中文句子；展示层负责翻译。
- 测试补一个带 Provider 的渲染辅助函数，保留现有中文断言，新增英文切换、偏好持久化与校验键的用例。
- 同步前端与根级文档、`openspec/config.yaml` 的 context，并附带 changeset。

## Capabilities

### New Capabilities

- `ui-localization`: 界面语言目录、默认语言与第二语言、语言选择与持久化、`<html lang>` 同步，以及组件文案必须来自文案目录的约束。

### Modified Capabilities

- `login-page`: 登录页文案改为可本地化；右上角除主题按钮外新增语言切换入口；校验错误与 Toast 按当前语言呈现。
- `register-page`: 注册页文案改为可本地化；复用同一语言状态；校验错误、发送验证码与演示提交提示按当前语言呈现。

## Impact

- 依赖：`apps/frontend` 新增 `next-intl`（进 `pnpm-workspace.yaml` 的 `frontend` catalog）与 `@workspace/i18n`。
- 工作区：新增 `packages/i18n`，workspace 包数量从十个变为十一个；Changesets 的 `fixed` 组、`scripts/sync-version.mjs`、根级文档中的包数量与结构需同步更新。
- 代码：`apps/frontend/src` 的认证组件、品牌栏、全局组件、校验函数与测试；新增语言 Provider 与切换组件；文案目录在 `packages/i18n`。
- 不改动：URL 结构、`output: "export"`、`trailingSlash`、Electron `app://` 入口、`packages/ui` 组件、BFF / backend。
- 明确不做：`[locale]` 路由、middleware / proxy 语言协商、浏览器语言自动检测、第三种语言、后端错误消息本地化。
