# frontend-components Specification

## Purpose

明确前端组件目录的分层与依赖方向：全局组件按布局与控件分层，认证私有组件按业务域分组，共享 UI 组件继续由 shadcn CLI 管理。该能力只约束代码组织，不改变用户可见行为。

## Requirements

### Requirement: 全局组件按职责分层

`apps/frontend/src/components` SHALL 按职责分为 `layout/` 与 `controls/` 两个子目录：布局级 Provider 与全局窗口 chrome MUST 放在 `layout/`；可交互的主题、语言等切换控件 MUST 放在 `controls/`。`layout/` MAY 组合 `controls/`；`controls/` MUST NOT import 布局组合或窗口 chrome，但 MAY 依赖 `layout/` 中的共享上下文 hook（如语言偏好）；全局目录 MUST NOT 放置页面专属业务组件。

#### Scenario: 新增布局级能力归位

- **WHEN** 新增一个包裹根布局的 Provider 或一个窗口级 chrome 组件
- **THEN** 文件放在 `src/components/layout/`，而不是平铺在 `src/components/` 或 `controls/`

#### Scenario: 新增切换控件归位

- **WHEN** 新增一个用户可操作的主题、语言或视图切换控件
- **THEN** 文件放在 `src/components/controls/`，并可由 `layout/` 组合

#### Scenario: 依赖方向不被反转

- **WHEN** 检查 `src/components/controls/` 的 import 与 `src/components/layout/` 的 Provider
- **THEN** `controls/` 不 import 布局组合或窗口 chrome，只允许依赖共享上下文 hook；Provider 互不依赖，也不依赖窗口 chrome

#### Scenario: 页面专属组件不进入全局目录

- **WHEN** 组件只在某个路由或认证流程内使用
- **THEN** 它留在对应路由的私有组件目录，不提升到 `src/components/`

### Requirement: 认证私有组件按域分组

`apps/frontend/src/app/(auth)/_components` SHALL 分为 `brand/`、`forms/` 与 `fields/`：品牌栏、产品标识与扫描背景 MUST 放在 `brand/`；登录与注册表单 MUST 放在 `forms/`；邮箱、密码、验证码字段 MUST 放在 `fields/`。目录内部 MUST 使用相对 import，MUST NOT 把认证私有组件移到全局 `components/` 或 `packages/ui`。

#### Scenario: 品牌与装饰归入 brand

- **WHEN** 新增或调整登录品牌栏、产品标记、产品标识或扫描线背景
- **THEN** 文件在 `_components/brand/`，并由品牌栏或认证布局引用

#### Scenario: 表单归入 forms

- **WHEN** 新增登录或注册表单
- **THEN** 文件在 `_components/forms/`，字段组件从 `../fields/` 引用

#### Scenario: 字段归入 fields

- **WHEN** 新增邮箱、密码或验证码输入字段
- **THEN** 文件在 `_components/fields/`，不放入 `forms/` 或全局 `components/`

#### Scenario: 路由私有边界

- **WHEN** 检查全局 `components/` 与 `packages/ui` 的导出
- **THEN** 其中不出现认证路由专属的表单、字段或品牌组件

### Requirement: 共享 UI 组件保持 CLI 边界

`packages/ui/src/components` SHALL 保持 shadcn CLI 落盘的平铺结构与现有 `./components/*` exports；本次组件重排 MUST NOT 手工搬动该目录，MUST NOT 把应用专属组件移入，也 MUST NOT 修改 `components.json` 的 aliases。

#### Scenario: CLI 安装路径不变

- **WHEN** 在仓库根执行 `pnpm dlx shadcn@latest add <component> -c apps/frontend`
- **THEN** 组件仍写入 `packages/ui/src/components/`，前端仍通过 `@workspace/ui/components/*` 引用

#### Scenario: 共享目录不被重排

- **WHEN** 检查 `packages/ui/src/components/`
- **THEN** 目录保持平铺，不新增 primitives / input / feedback / effects 等子目录

### Requirement: 目录重排不改变行为

组件目录重排 MUST NOT 改变 URL、静态导出产物路径、`app://` 入口、组件行为或文案键；现有测试、源码扫描与构建 MUST 继续通过。

#### Scenario: 构建产物不变

- **WHEN** 执行前端静态导出构建
- **THEN** `out/login/index.html`、`out/register/index.html` 等路径与重排前一致

#### Scenario: 扫描测试覆盖新目录

- **WHEN** 运行 `no-arbitrary-px` 与 `no-hardcoded-copy` 测试
- **THEN** 扫描递归覆盖 `layout/`、`controls/`、`brand/`、`forms/`、`fields/`，并照常拦截违规

#### Scenario: 行为测试保持通过

- **WHEN** 运行前端与桌面壳测试
- **THEN** 登录、注册、语言、主题与窗口行为断言在更新 import 后继续通过
