# Tasks

## 1. 共享文案包 `packages/i18n`

- [x] 1.1 新建 `packages/i18n`：`package.json`（`@workspace/i18n`、源码包、无构建、`exports` 指向 `./src/index.ts`）、`tsconfig.json`（继承 `@workspace/typescript-config/base.json`）、`check-types` / `test` / `lint` / `format` 脚本。
- [x] 1.2 新建 `src/config.ts`：`locales`、`defaultLocale`、`LOCALE_STORAGE_KEY`（`interface-test-agent:locale`）与 `isLocale()` 守卫；新建 `src/index.ts` 汇总导出配置、词表与 `Messages` 类型。
- [x] 1.3 新建 `src/messages/zh-CN.json` 与 `en-US.json`，按 `common` / `auth` / `fields` / `brand` / `meta` 命名空间迁移现有文案；`en-US` 用 `satisfies` 约束同一结构，`Messages` 从 `zh-CN` 推导。
- [x] 1.4 新建包内 Vitest 配置与 `__tests__`：覆盖语言守卫、非法值回落、中英键集合一致性；行覆盖率不低于 95%。
- [x] 1.5 新建该包 `README.md` / `CLAUDE.md` / `AGENTS.md`，写明包职责、命令、导出与「只放文案与配置、不放 React」的边界。
- [x] 1.6 在 `.changeset/config.json` 的 `fixed` 组加入 `@workspace/i18n`；在 `scripts/sync-version.mjs` 的包列表加入 `packages/i18n`，并补齐当前遗漏的 `packages/request`。

## 2. 前端接入

- [x] 2.1 在 `pnpm-workspace.yaml` 的 `frontend` catalog 增加 `next-intl`；`apps/frontend` 增加 `next-intl` 与 `@workspace/i18n` 依赖；`next.config.ts` 的 `transpilePackages` 加入 `@workspace/i18n`；执行 `pnpm install`。
- [x] 2.2 新建 `src/components/locale-provider.tsx`：首帧固定 `defaultLocale`，挂载后读取偏好并同步 `<html lang>`、`document.title`，监听存储变化。
- [x] 2.3 新建 `src/components/locale-toggle.tsx`：两段式按钮（中 / EN），`aria-pressed` 表达选中态，可读名称走文案键，可键盘操作。
- [x] 2.4 在根 layout 挂载 `LocaleProvider`；在认证布局右上角将 `LocaleToggle` 放到 `ThemeToggle` 左侧，两者同一 flex 容器，窄屏不遮挡表单。

## 3. 界面文案迁移

- [x] 3.1 迁移 `email-field`、`password-field`、`code-field` 的标签、占位符、显示/隐藏密码与发送验证码的可访问性文案。
- [x] 3.2 迁移 `login-form` 的标题、说明、提交/提交中状态、记住邮箱、“去注册”、Toast 与表单级错误文案。
- [x] 3.3 迁移 `register-form` 的标题、说明、提交/提交中状态、发送与倒计时、返回登录、Toast 与演示说明文案。
- [x] 3.4 将 `login-brand-panel` 改为客户端组件，迁移产品名、副标题、眉标、四步轨道（含状态）、闭环说明、引语与版本行文案。
- [x] 3.5 迁移 `theme-toggle` 的 `aria-label` 与其余全局可访问性文案。
- [x] 3.6 为 `meta` 命名空间补中英标题与描述；确认 Provider 切换语言后 `document.title` 跟随。

## 4. 校验层改造

- [x] 4.1 将 `validate-auth.ts` 的 `AuthErrors` 从字符串改为错误键联合类型，插值参数（`min`、`length`）由展示层传入。
- [x] 4.2 更新登录/注册表单，把错误键通过 `t()` 翻译后再展示；Toast 文案同样来自 `@workspace/i18n`。
- [x] 4.3 重写 `validate-auth.test.ts`，断言错误键与优先级，不再断言中文句子。

## 5. 测试与覆盖率

- [x] 5.1 新增 `apps/frontend/__tests__/test-utils.tsx`：带 `NextIntlClientProvider` 的渲染辅助，默认 zh-CN，支持按用例覆盖语言。
- [x] 5.2 更新现有组件与布局测试使用渲染辅助，保留中文断言；确认默认语言行为不变。
- [x] 5.3 新增用例：切换英文后表单/品牌栏文案为英文、偏好写入本地存储并在重新渲染后恢复、切换语言不改 URL、`<html lang>` 与标题同步。
- [x] 5.4 运行 `pnpm --filter @workspace/i18n test` 与 `pnpm --filter frontend test`，两个包行覆盖率均不低于 95%。

## 6. 文档与变更记录

- [x] 6.1 更新 `apps/frontend/README.md` / `CLAUDE.md` / `AGENTS.md`：i18n 依赖、Provider 与切换组件位置、文案只能来自 `@workspace/i18n`、校验返回键、静态导出限制。
- [x] 6.2 更新根 `README.md` / `CLAUDE.md` / `AGENTS.md`：workspace 包数量从十个改为十一个、目录树加入 `packages/i18n`、相关命令与职责描述。
- [x] 6.3 同步 `openspec/config.yaml` 的 `context`：包数量、当前状态与国际化能力描述。
- [x] 6.4 添加 changeset，说明新增前端国际化能力与共享文案包。

## 7. 验证

- [x] 7.1 运行 `pnpm --filter @workspace/i18n check-types`、`lint`、`format`、`test`，全部退出码 0。
- [x] 7.2 运行 `pnpm --filter frontend check-types`、`lint`、`format`、`test`、`build`，全部退出码 0，且 `out/login/index.html`、`out/register/index.html` 仍生成。
- [x] 7.3 开发态在桌面宽度与窄屏分别检查中/英界面：切换入口与主题入口不重叠，表单、品牌栏、Toast、倒计时均随语言变化。
- [x] 7.4 关闭页面后重新打开，确认语言偏好恢复；清除偏好后回落中文。
- [x] 7.5 `pnpm --filter frontend build` 后执行 `pnpm --filter desktop build`，确认 `app://` 入口路径不变、语言切换与持久化在桌面加载下生效。
- [x] 7.6 运行 `pnpm sherif` 与 `pnpm knip`，确认新包的依赖、导出一致，无死文件与死依赖。
