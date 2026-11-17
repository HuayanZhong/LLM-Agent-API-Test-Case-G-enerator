# Tasks

> 2.x 记录静态登录页初版；6.x 为邮箱登录、Toast、注册页与主题按钮位置的扩展。

## 1. 依赖与共享组件

- [x] 1.1 在仓库根执行 `pnpm dlx shadcn@latest add input label checkbox alert -c apps/frontend`，确认四个组件写入 `packages/ui/src/components/`，并检查 `git diff` 只包含组件、`packages/ui/package.json` 与 `components.json` 的预期变化
- [x] 1.2 把 `lucide-react` 加入 `pnpm-workspace.yaml` 的 `frontend` catalog，并在实际 import 的 `packages/ui` / `apps/frontend` 声明；验证 `pnpm install`、`pnpm sherif` 与 `pnpm --filter @workspace/ui check-types` 均以 0 退出
- [x] 1.3 在 `packages/ui/__tests__/` 为 `input`、`label`、`checkbox`、`alert` 补渲染与交互测试；验证 `pnpm --filter @workspace/ui test` 行覆盖率 ≥ 95%，`lint` 与 `format` 通过

## 2. 登录页实现

- [x] 2.1 实现 `apps/frontend/src/app/login/_lib/validate-login.ts`：账号必填、密码必填且至少 6 位，返回字段错误映射；在 `__tests__/validate-login.test.ts` 覆盖空值、短密码与合法输入，验证用例全部通过
- [x] 2.2 实现 `src/app/login/_components/login-brand-panel.tsx` 与 `product-mark.tsx`：产品标识、四步复验轨道、红线引语、版本与环境信息；只使用语义 token；在登录页测试中断言四个步骤与引语可见
- [x] 2.3 实现 `src/app/login/_components/login-form.tsx` 与 `_hooks/use-remembered-account.ts`：受控账号/密码、密码显隐、记住账号、提交 loading、演示提示、主题切换、错误关联与首个错误焦点；验证 `pnpm --filter frontend check-types` 与 `lint` 以 0 退出，`pnpm --filter frontend dev` 下 `/login/` 可渲染
- [x] 2.4 在 `__tests__/login.test.tsx` 覆盖空提交、短密码、合法提交、密码显隐、记住账号写入/清除、提交中禁用、错误焦点与主题按钮；用 fake timers 处理 600ms 延时，验证 `pnpm --filter frontend test` 用例全部通过
- [x] 2.5 新增 `src/app/login/page.tsx` 组装品牌栏与表单并保留页面 metadata；验证 `pnpm --filter frontend build` 后 `out/login/index.html` 存在且包含登录表单标记
- [x] 2.6 把 `src/app/page.tsx` 改为客户端跳转 `/login/`，更新 `__tests__/page.test.tsx` mock `next/navigation` 并断言 `router.replace("/login/")`，验证用例通过
- [x] 2.7 运行 `pnpm --filter frontend dev`，在 1280×800、1024×800、768–1023 窄双栏与窄于 768 的视口检查双栏/单栏、无横向溢出、明暗主题与键盘焦点，记录检查结果

## 3. 文档与发布记录

- [x] 3.1 更新 `apps/frontend/README.md` 与 `apps/frontend/CLAUDE.md`：记录 `/login/`、`_components` / `_hooks` / `_lib` 私有目录与测试入口；验证文中路径均存在、命令可执行
- [x] 3.2 检查根 `README.md`、`CLAUDE.md`、`AGENTS.md` 中前端当前状态与页面入口；有变化则同步，无变化则在提交说明中写明原因；验证相关链接可达
- [x] 3.3 更新 `openspec/config.yaml` 的 `context` 前端状态描述，验证 `pnpm exec openspec validate --all` 通过
- [x] 3.4 执行 `pnpm changeset` 记录本次功能变更并提交生成文件，验证 `pnpm changeset:status` 显示该变更

## 4. 集成验证

- [x] 4.1 运行 `pnpm --filter frontend test`、`check-types`、`lint`、`format`，验证退出码均为 0 且行覆盖率 ≥ 95%
- [x] 4.2 运行 `pnpm --filter frontend build`，验证 `apps/frontend/out/login/index.html`、`out/index.html`、`out/_next` 存在，且 `out/login/index.html` 含登录表单内容
- [x] 4.3 运行 `pnpm sherif`、`pnpm knip`、`pnpm exec openspec validate --all`，验证全部以 0 退出，无新增未声明依赖或死文件

## 5. 评审反馈修正

- [x] 5.1 把登录页专属组件、hook、校验收敛到路由私有目录，更新页面与测试 import；验证 frontend test、check-types、lint 通过
- [x] 5.2 去掉 `ProductMark` 的绝对像素定位与任意值类，把密码长度、演示延时、存储键、编号宽度集中到 `_lib/auth-constants.ts`，补 `sm / xl / 2xl` 间距与字号阶梯；在 375 / 640 / 768 / 900 / 1024 / 1280 / 1920 宽度检查双栏/单栏、无横向溢出
- [x] 5.3 为 `packages/ui` 的 `input` / `label` / `checkbox` / `alert` 补 `stories/` Storybook stories，更新 UI README；验证 `pnpm --filter @workspace/ui build-storybook` 与 lint / format 通过
- [x] 5.4 复跑 `pnpm test`、`check-types`、`lint`、`format`、`sherif`、`knip`、`openspec validate --all` 与 frontend build；验证全部以 0 退出
- [x] 5.5 为登录页页面、品牌栏、表单、hook、校验与测试补关键注释，重点写“为什么”、边界与可访问性约束；验证 lint、format、check-types 与测试通过
- [x] 5.6 移除 `ThemeProvider` 的全局 `d` 快捷键与相关测试，主题切换只保留登录页可见按钮；验证 frontend test、lint、format、check-types 与 build 通过
- [x] 5.7 补 `md` 2:3、`lg` 起固定 1:1 的两列栅格（不使用 `col-span`，`2xl` 不再改比例），左栏内容列与表单只在 `xl` 放宽一档；验证 768 / 900 / 1024 / 1280 / 1536 / 1920 / 2560 下右栏表单始终可见、宽度连续且无横向溢出
- [x] 5.8 用根字号 `clamp(16px, 1vw, 20px)` 统一大屏缩放，移除逐组件 `3xl:` 放大；验证 1920 / 2560 下文字、间距、表单控件等比放大且无横向溢出
- [x] 5.9 给认证主栅格加 `grid-rows-1` 并让左栏内容整体垂直居中、引语紧随轨道；验证 1280 / 1536 / 1920 / 2560 下 `aside` 与 `section` 撑满视口、底部不再出现面板背景以外的空白带

## 6. 邮箱登录与注册 UI 扩展

- [x] 6.1 安装 `sonner`（catalog `frontend`）与 shadcn `sonner` 组件，补 UI 包装测试与 Storybook story；验证 `pnpm --filter @workspace/ui test`、`lint`、`format` 与 `build-storybook` 通过
- [x] 6.2 把认证代码迁到 `src/app/(auth)/` 路由组：共享 `layout.tsx`、`login/page.tsx`、`register/page.tsx`；主题按钮固定页面右上角；验证构建产物包含 `out/login/index.html` 与 `out/register/index.html`
- [x] 6.3 登录页改为邮箱 + 密码：`EmailField` / `PasswordField`、`useRememberedEmail`、表单级 Toast、注册入口；验证登录测试与覆盖率
- [x] 6.4 新增注册页：邮箱 + 密码 + 6 位验证码，发送验证码 Toast 与 60s 冷却，提交成功 Toast，返回登录入口；验证注册测试
- [x] 6.5 为 `validate-auth`、`use-remembered-email`、`theme-toggle`、`auth-layout`、登录/注册页面补测试；验证 frontend 行覆盖率 ≥ 95%
- [x] 6.6 同步 proposal / design / specs / tasks、前端与 UI README / CLAUDE、根文档与 changeset；复跑 test、check-types、lint、format、sherif、knip、openspec validate 与 build
- [x] 6.7 把“还没有账号？去注册”移到“记住邮箱”同一行右侧，窄屏允许换行；验证 1280 与 375 下无溢出且链接可点击
- [x] 6.8 保持 `sonner` 组件为 shadcn CLI 默认，业务侧直接使用 `toast`；不做 `icons`、颜色条或 `richColors` 覆盖，类型由默认图标区分；验证明暗主题下 Toast 正常渲染
- [x] 6.9 用 shadcn `InputOTP` 替换验证码单输入框，按 2 + 分隔符 + 2 + 分隔符 + 2 分组，应用层 className 让三组槽位填满表单行（1280 下 OTP 348 + 发送按钮 92 + 间距 8 = 448），小屏发送按钮纵向排列；验证 375 下无横向溢出
- [x] 6.10 按评审修正：验证码格式错误优先于“请先获取验证码”；改邮箱后按空验证码与 `codeSent=false` 重新校验；发送成功清除失效错误；焦点顺序改为邮箱→密码→验证码；OTP `pattern` 锚定为 `^[0-9]*$`；取消“记住邮箱”立即清除本地邮箱并保留当前输入；补 Toast 文案、冷却归零、`aria-describedby`、密码不落盘、跨标签同步与 OTP 分组测试；同步注释与包级文档

## Workflow follow-up

- 实现完成并通过评审后，用 `openspec-archive-change` 归档；确认 `openspec/specs/login-page/spec.md` 已生成且 `openspec validate --all` 通过。
- 工作台与真实认证就位后，另开变更处理 `/` 守卫与真实登录，不在本变更内扩展。
