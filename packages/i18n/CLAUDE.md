# CLAUDE.md

本文件是 `packages/i18n` 的包级规则。项目级规则见 [../../CLAUDE.md](../../CLAUDE.md)。

## 本包职责

`@workspace/i18n`：共享界面文案目录与语言配置。只发源码与 JSON，无构建、无进程、无端口。

## 命令与端口

- 无端口、无 dev/build 脚本。
- `pnpm --filter @workspace/i18n test`：vitest run --coverage，行覆盖率 ≥ 95%。
- `pnpm --filter @workspace/i18n check-types` / `lint` / `format`：本包检查，配置用仓库根 Oxc 文件。

## 目录与入口

- `src/config.ts`：`LOCALES`、`DEFAULT_LOCALE`、`DEFAULT_TIME_ZONE`、`LOCALE_META`、`LOCALE_STORAGE_KEY`、`isLocale`、`resolveLocale`。
- `src/messages/zh-CN.json`：键集合唯一事实来源；`en-US.json` 用 `satisfies Messages` 对齐结构。
- `src/messages/index.ts`：聚合 `messages` 并导出 `Messages` 类型。
- `src/index.ts`：包入口；`exports` 只指向它。
- `__tests__/`：配置回落、键集合与占位符一致性。

## 本包约束

- 只放文案与纯配置；不要引入 React、Next、`localStorage` 或任何浏览器 API。Provider、切换组件与存储读写留在 `apps/frontend`。
- 新增文案键时先改 `zh-CN.json`，再补 `en-US.json`；`satisfies` 会在缺键或类型不一致时报错。
- ICU 占位符必须两侧一致；`__tests__/messages.test.ts` 会逐键比较占位符。
- 语言标签只允许 `LOCALES` 中的值；未知值必须回落 `DEFAULT_LOCALE`，不要在组件里各自写兜底。
- 语言自身的显示名放 `LOCALE_META`（`short` / `name`），用母语写法，不随界面语言翻译；它属于语言元数据，不进 `messages` 词表。
- 存储键固定 `interface-test-agent:locale`，与“记住邮箱”共用命名空间；不要改成其他前缀。
- 包内不做业务校验、不放错误码；校验函数产出的错误键属于前端业务层。
- 不引入构建产物；消费方是 Next / Vite 的 bundler，直接读 `.ts` 与 `.json`。

## 改动前读什么

- 文档同步规则：[../../.claude/rules/doc-sync.md](../../.claude/rules/doc-sync.md)
- 前端接入与 Provider：[../../apps/frontend/CLAUDE.md](../../apps/frontend/CLAUDE.md)
- 注释规则：[../../.claude/rules/code-comments.md](../../.claude/rules/code-comments.md)

## 验证

- `pnpm --filter @workspace/i18n test` 通过，行覆盖率 ≥ 95%；新增语言或键时确认键集合测试失败过、补全后恢复。
- `pnpm --filter @workspace/i18n check-types`、`lint`、`format` 退出码 0。
- `pnpm --filter frontend check-types` 与 `build` 通过，确认消费方类型解析正常。
