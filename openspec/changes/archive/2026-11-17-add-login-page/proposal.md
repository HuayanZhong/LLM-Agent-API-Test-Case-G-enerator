# Proposal

## Why

前端目前只有骨架页，桌面端启动后没有可演示的入口；后续工作台、权限与导航都需要先有登录与注册入口。当前阶段不接 Supabase 或后端，也不假设服务端会话，因此认证页面必须能在 `output: "export"` 的静态导出与 Electron `app://` 托管下独立工作。

## What Changes

- 新增 `/login/` 客户端登录页：邮箱、密码、记住邮箱、密码显隐、字段级校验、提交 loading，以及表单级 Toast 反馈。
- 新增 `/register/` 注册页：邮箱、密码、6 位验证码、演示发送验证码与冷却倒计时、字段级校验、Toast 反馈；不创建真实账号。
- 两个路由共用认证布局：品牌栏、移动端产品标识、右上角主题切换按钮与 Toast 容器。
- 根路径 `/` 保持不变，客户端跳转到 `/login/`；工作台就位后再把 `/` 改回工作台并加守卫。
- 通过 shadcn CLI 增加 `input`、`label`、`checkbox`、`alert`、`sonner` 组件，并引入 `lucide-react` 与 `sonner` 处理图标与 Toast。
- 新增纯函数校验、邮箱记忆 hook 与登录 / 注册测试，保持前端行覆盖率 95% 门槛。
- 不接 Supabase Auth / BFF / backend，不做找回密码、第三方登录，不创建 `/workspace` 工作台页面。
- 不新增全局色板或字体；沿用现有语义 token、系统字体与全局根字号缩放。

## Capabilities

### New Capabilities

- `login-page`: 静态导出约束下的邮箱登录页路由、表单校验、记住邮箱、Toast 反馈、演示提交态与可访问性行为。
- `register-page`: 静态导出约束下的注册页路由、邮箱 / 密码 / 验证码校验、演示发送与提交反馈。

### Modified Capabilities

（无）

## Impact

- `apps/frontend`：新增 `src/app/(auth)/` 路由组，包含共享 `layout.tsx`、`login/page.tsx`、`register/page.tsx`；认证私有组件放 `_components`，邮箱记忆 hook 放 `_hooks`，校验收在 `_lib`；新增登录、注册、布局与字段测试；修改 `src/app/page.tsx` 与 `__tests__/page.test.tsx`。
- `packages/ui`：通过 shadcn CLI 新增 `input`、`label`、`checkbox`、`alert`、`sonner`；新增 `lucide-react`、`next-themes`、`sonner` 依赖（catalog `frontend`）；为组件补 `stories/` 下的 Storybook story 与测试。
- 依赖：`lucide-react`、`sonner`、`next-themes` 需在 `packages/ui` 与 `apps/frontend` 按实际 import 声明，版本统一走 `pnpm-workspace.yaml`。
- 文档：同步 `apps/frontend/README.md`、`apps/frontend/CLAUDE.md`、`packages/ui/README.md`；归档时更新 `openspec/config.yaml` 的前端状态描述。
- 无 API、环境变量、BFF、backend 或数据模型改动；Supabase 接入留到后续变更。
