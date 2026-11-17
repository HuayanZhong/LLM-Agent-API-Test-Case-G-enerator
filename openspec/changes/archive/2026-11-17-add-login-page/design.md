# Design

## Context

动机见 `proposal.md`，行为契约见 `specs/login-page/spec.md`。实现受以下现状约束：

- `apps/frontend` 是 Next.js 16 App Router，`output: "export"` + `trailingSlash: true`；没有 middleware、Server Actions、cookies 会话或动态 Route Handler。
- 目前只有 `/` 一个骨架页；`packages/ui` 只有 `button`、`card`；主题为 neutral 单色，字体为系统字体 + `--font-mono`。
- Electron 生产包通过 `app://` 托管静态导出，主窗口最小 1024×800；渲染进程只跑前端，不直接访问 Node。
- 测试用 Vitest + Testing Library，前端行覆盖率门槛 95%；`src/app/layout.tsx` 已在覆盖率排除项中。
- shadcn 组件必须经 CLI 装进 `packages/ui`，页面与业务逻辑留在 `apps/frontend`。

## Goals / Non-Goals

**Goals:**

- 在静态导出与 `app://` 下可独立工作的 `/login/` 与 `/register/` 页面。
- 邮箱登录、密码显隐、记住邮箱、Toast 反馈、演示提交态、响应式双栏与可访问性。
- 注册页提供邮箱、密码与 6 位验证码的演示发送 / 提交流程，不创建真实账号。
- 认证私有组件、hook、校验收敛在路由组私有目录，避免污染全局 `src/components` / `src/lib`。
- 新增的共享 UI 组件补齐 Storybook stories，保持 `packages/ui` 的交付完整性。
- 保持现有主题与依赖边界，不引入服务端能力。
- 用组件测试覆盖新增行为，维持 95% 行覆盖率。

**Non-Goals:**

- 真实认证、会话、路由守卫、BFF / Supabase / SSO 接入。
- 找回密码、第三方登录、工作台页面。
- 新增全局色板或 webfont。
- 在 `packages/types` 定义认证 API 契约（本期没有 API）。

## Decisions

### 1. 路由：`/login/` + `/register/` + 根路径客户端跳转

新增 `src/app/(auth)/layout.tsx`、`login/page.tsx`、`register/page.tsx`；路由组目录带括号，不进入 URL。`src/app/page.tsx` 挂载后 `router.replace("/login/")`。

- 备选：登录与注册各写一套布局。品牌栏、主题按钮与 Toast 会重复，后续改视觉要改两处。
- 备选：同页 Tab 切换。路由不分开，后续接 Supabase 的 `signUp` / `signIn` 跳转与回跳更难对齐。
- 选择理由：两个 URL 稳定，共享 `(auth)/layout.tsx`；工作台就位后 `/` 改为工作台并加守卫。

### 2. 表单：受控状态 + 纯函数校验

用 `useState` 管理邮箱、密码、验证码、记住邮箱、错误与提交态；校验逻辑抽到 `src/app/(auth)/_lib/validate-auth.ts`，返回字段错误映射。

- 备选：react-hook-form + zod。对两个静态表单引入 3 个依赖，收益不足；纯函数更易达到 95% 覆盖率。
- 备选：使用 shadcn `form` 组件。它依赖 RHF，与上一条冲突。
- 校验时机：首次提交时全量校验；之后输入变化重新校验已出现的字段，避免“提交后才修正仍显示旧错误”。

### 3. 提交：只做前端演示，不伪造认证

合法提交后设置 loading，约 600ms 后通过 Toast 显示“认证服务尚未接入 / 不会创建真实账号”，URL 不变；校验失败用 Toast 汇总，字段错误仍留在输入框下。

- 备选：内置演示账号并判断对错。会制造一个不存在的认证契约，后续接后端必须拆掉。
- 备选：跳转 `/workspace` 占位页。超出本期范围，且会留下一个假的工作台。
- 选择理由：静态页面阶段只承诺校验与交互，不承诺身份。

### 4. 记住邮箱：localStorage 只存邮箱

键名 `interface-test-agent:last-email`；勾选并合法提交时写入邮箱，未勾选时删除；初始化时读取并预填。密码永不写入任何存储。

- 备选：`sessionStorage`。桌面端重启后失效，不符合“记住邮箱”的预期。
- 备选：cookie。静态导出没有服务端读取方，且 Electron `app://` 下没有收益。
- 安全边界：存储内容仅为邮箱；页面不渲染用户输入为 HTML，XSS 面保持最小。

### 5. 组件与图标：shadcn CLI + lucide + sonner

安装 `input`、`label`、`checkbox`、`alert`、`sonner` 到 `packages/ui`；密码显隐用 `Eye` / `EyeOff`，主题切换用 `Moon` / `Sun`，表单级反馈用 `toast`。

- 备选：手写输入框与错误样式。违反“shadcn 组件只能经 CLI 安装”的包规则。
- 备选：用文字按钮代替图标。可访问性可以，但视觉密度与现有 shadcn 风格不一致。
- 备选：保留页面内 Alert。用户明确要求改成弹窗提示；Toast 是非阻断的表单级反馈，字段错误仍保留在输入框下方。
- 样式：`sonner` 组件保持 shadcn CLI 默认，不手改源码，也不做 `icons`、颜色条或 `richColors` 覆盖；成功 / 错误由组件默认图标区分。
- 依赖：`lucide-react`、`sonner`、`next-themes` 统一放进 `pnpm-workspace.yaml` 的 `frontend` catalog；按实际 import 在 `packages/ui` / `apps/frontend` 声明，避免 knip / sherif 报错。

### 6. 视觉：分栏 + “复验轨道”作为签名元素

`md` 起窄双栏（2:3）：左侧产品标识与四步复验轨道，右侧登录表单；`lg` 起等宽双栏并展开完整品牌文案；`<md` 单列并隐藏左栏。

- 轨道内容：`01 生成用例 / 02 执行测试 / 03 比对现场 / 04 输出报告`，每步配一个等宽小字状态（待输入 / Agent / GraphRAG / 人工确认）。
- 颜色只用现有语义 token：`bg-background`、`bg-sidebar`、`text-muted-foreground`、`border-border`、`text-destructive`；不新增品牌色，不写死颜色。
- 字体：标题与正文用现有系统字体栈；编号、状态、版本号用 `--font-mono`。不引入 webfont。
- 响应式：`md` 起窄双栏，`lg` 起固定等宽双栏，`2xl` 不再改列比例；`<md` 单列。全局根字号 `clamp(16px, 1vw, 20px)` 让所有 rem 尺寸随视口等比放大；表单列 `max-w-sm` → `xl:max-w-md`，保留可读行长；产品标记用 flex，避免绝对像素定位。
- 备选：居中卡片。落地更快，但论文截图辨识度低，且没有承载产品链路的位置。
- 备选：深色营销 hero。偏官网，不像 B 端工具。
- 风险控制：签名只保留轨道一处；其余留白、按钮与输入保持安静，不加渐变、插画或玻璃拟态。

### 7. 可访问性与交互细节

- 每个输入使用 `<label htmlFor>`；错误文本通过 `aria-describedby` 关联，并设置 `aria-invalid`。
- 提交失败后把焦点移到第一个错误字段；字段错误保留在输入框下，表单级错误与成功结果通过 Toast 播报。
- 密码切换按钮使用 `aria-label` 与 `aria-pressed`；主题按钮同样有可读名称，并固定在页面右上角。
- 登录表单的“记住邮箱”与“还没有账号？去注册”放在同一行，左侧选项、右侧次要导航；窄屏允许换行。
- 主题切换只保留可见按钮，不注册全局键盘快捷键，避免与输入框、桌面壳快捷键冲突。
- 仅保留必要的 150ms 过渡；不使用入场动画，天然满足 reduced-motion。

### 8. 测试策略

- `__tests__/login.test.tsx`：渲染、空提交、邮箱格式、密码过短、合法提交、密码显隐、记住邮箱写入/清除、提交中禁用、错误焦点、Toast 调用。
- `__tests__/register.test.tsx`：空提交、邮箱/验证码/密码错误、发送验证码、冷却倒计时、修改邮箱重置、合法提交 Toast。
- `__tests__/use-remembered-email.test.tsx`：本地恢复、编辑状态、保存去空格与只清除邮箱键。
- `__tests__/theme-toggle.test.tsx` 与 `__tests__/auth-layout.test.tsx`：主题切换、品牌栏与 Toast 容器组合。
- `__tests__/page.test.tsx`：mock `next/navigation` 的 `useRouter`，断言 `replace("/login/")`。
- 提交延时用 fake timers + `fireEvent`；每个用例后清空 `localStorage` 与定时器；Toast 用 `vi.mock("sonner")` 断言调用。
- `packages/ui/stories/` 为 `input`、`label`、`checkbox`、`alert`、`sonner` 补 stories，`pnpm --filter @workspace/ui build-storybook` 验证。
- 不做 e2e；静态导出兼容性由 `pnpm --filter frontend build` 与产物检查覆盖；响应式在 375 / 640 / 768 / 900 / 1024 / 1280 / 1920 / 2560 宽度下用浏览器实测。

### 9. 路由组与私有目录

认证代码放 `src/app/(auth)/`：`layout.tsx` 共享品牌栏、主题按钮与 Toast 容器；`login/page.tsx`、`register/page.tsx` 只渲染各自表单。表单组件、hook、纯函数放 `_components`、`_hooks`、`_lib`。Next App Router 以下划线前缀标记私有目录，路由组目录带括号，都不参与 URL；测试仍集中在 `apps/frontend/__tests__`。

- 备选：登录与注册各写一套布局。品牌栏、主题按钮与 Toast 会重复。
- 选择理由：认证页面共享同一视觉壳；后续接 Supabase 时只需替换表单提交层。

认证主栅格使用 `grid-rows-1`，让唯一一行撑满 `min-h-svh`；否则大屏下栅格行按内容高度收缩，面板背景下方会露出页面底色，形成一大块空白带。左栏内容整体垂直居中，红线引语紧随轨道，不再作为底部 footer。

### 10. 响应式阶梯

断点只承担布局切换，尺寸用 Tailwind 的 `sm` / `lg` / `xl` / `2xl` 阶梯，不写死页面宽度或绝对像素位置。

- 栅格：`md` 2:3，`lg` 起固定 1:1；不再在 `2xl` 改列比例，避免列宽突变导致表单宽度跳变。
- 左栏：`md` 只显示标识与轨道，`lg` 展开完整定位文案，`xl` / `2xl` 放大间距与标题。
- 左栏内容列：`max-w-md` → `xl:max-w-lg`，之后只随根字号放大，不再在 `2xl` 改上限。
- 右栏：表单 `max-w-sm` → `xl:max-w-md`，之后只随根字号放大，不再在 `2xl` 改上限。
- 全局缩放：`--app-font-scale: clamp(16px, 1vw, 20px)` 设在 `html`；1600px 以下 16px，2560px 20px，所有 rem 尺寸（文案、间距、表单控件）等比放大，不再逐组件手动放大。
- 产品标记：用 `flex` + `gap` 排列三条线，尺寸由 `size-*` 控制，不再用绝对定位。
- 数值：密码长度、验证码长度、演示延时、验证码冷却、邮箱存储键、轨道编号宽度集中在 `_lib/auth-constants.ts`；组件里不写裸数字，也不使用任意值类，尺寸用 Tailwind 的间距 / 比例 token。
- 备选：固定 1280 设计稿。桌面窗口可缩放，固定尺寸会在 1024 最小宽度或高分屏下拥挤。

### 11. 注册流程：UI 演示，映射 Supabase signUp + code

注册页按“邮箱 → 密码 → 6 位验证码”组织，先点击“发送验证码”进入冷却，再提交；验证码与提交结果都通过 Toast 展示。验证码使用 shadcn `InputOTP`，按 2 + 分隔符 + 2 + 分隔符 + 2 分组，应用层通过 `containerClassName` / `InputOTPGroup` / `InputOTPSlot` 的 className 让三组槽位填满表单行，小屏改为纵向排列发送按钮。验证码校验分两级：格式不合法时优先显示格式错误，格式合法但未点击发送时才提示“请先获取验证码”；修改邮箱会清空验证码、发送状态与冷却，并按空验证码重新校验。错误焦点按视觉顺序（邮箱 → 密码 → 验证码）移动。当前不调用 Supabase，但字段与顺序对应未来的 `signUp({ email, password })` + 邮件 `{{ .Token }}` + `verifyOtp`。

- 备选：先 OTP 验证再设置密码。更接近免密码流程，但用户明确要邮箱 + 密码 + code。
- 备选：自建验证码接口。本期没有后端，超出范围。
- 演示边界：验证码不会真正发送，注册不会创建账号；接入真实认证时替换发送与提交实现。

## Risks / Trade-offs

- **没有真实守卫** → 明确标注演示态；真实会话与守卫留给后续认证变更。
- **根路径客户端跳转有短暂空白** → 根页面只渲染最小占位，不渲染骨架内容；桌面首屏可接受。
- **`app://` 下 localStorage 的生命周期与开发态 `http://localhost:3000` 不同** → 只存邮箱，丢失无业务影响。
- **600ms 人为延时** → 仅用于演示 loading；接入真实认证时删除，测试用 fake timers 避免拖慢。
- **md / lg + 根字号缩放** → `md` 窄双栏、`lg` 起固定等宽；根字号在 1600–2560 间从 16px 平滑到 20px；在 375 / 640 / 768 / 900 / 1024 / 1280 / 1536 / 1920 / 2560 宽度与 600–1392 高度下实测，避免拥挤或溢出。
- **Toast 在测试里是副作用** → 用 `vi.mock("sonner")` 断言调用，真实可见性由浏览器实测与 Storybook 覆盖。
- **验证码演示容易被误解为真实发送** → 页面常驻“不会真正发送邮件”说明，Toast 也写明演示模式。
- **shadcn CLI 可能顺带修改样式或依赖** → 安装后检查 diff，确认 catalog 版本与 `exports` 未被意外改动。
- **Storybook story 与组件 API 漂移** → 新组件补 stories 并跑 `build-storybook`，与 `autodocs` 一起校验 props 描述。
- **单色方案容易显平** → 辨识度由轨道结构、字号层级与等宽元数据承担；若实测偏空，优先调整留白与字重，不加装饰色。

## Migration Plan

无数据或 API 迁移。上线顺序：安装组件与依赖 → 认证路由组与共享布局 → 登录邮箱化与 Toast → 注册页与验证码演示 → 测试、Storybook 与文档 → 构建校验。回滚时删除 `(auth)/register` 并把登录页恢复为纯静态演示即可，不影响后端与桌面壳。

## Open Questions

- 真实 Supabase 接入时，登录成功后的跳转目标与工作台守卫另行设计；本期只到 UI 演示。
- 产品标识的最终图形素材尚未确定，本期先用 CSS 几何标记；不改变规格与任务拆分。
