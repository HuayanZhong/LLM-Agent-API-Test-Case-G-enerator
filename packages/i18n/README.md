# @workspace/i18n

共享界面文案目录与语言配置。源码包、无构建；只提供 JSON 文案、语言常量与类型，不依赖 React / Next。

## 职责

给前端提供唯一文案事实来源：`zh-CN` 是默认语言与键集合基准，`en-US` 必须保持同一结构。消费方通过 `@workspace/i18n` 读取语言列表、存储键与词表，再用 next-intl 的 Provider 渲染。

## 运行

```bash
pnpm --filter @workspace/i18n test     # vitest run --coverage，行覆盖率 ≥ 95%
pnpm --filter @workspace/i18n test:watch
pnpm --filter @workspace/i18n check-types
pnpm --filter @workspace/i18n lint
pnpm --filter @workspace/i18n format
```

本包没有 `dev` / `build` 脚本。

## 目录

```text
packages/i18n/
├── src/
│   ├── config.ts          # LOCALES、DEFAULT_LOCALE、DEFAULT_TIME_ZONE、LOCALE_STORAGE_KEY、isLocale、resolveLocale
│   ├── messages/
│   │   ├── zh-CN.json     # 键集合唯一事实来源
│   │   ├── en-US.json     # satisfies 同一结构
│   │   └── index.ts       # messages 聚合与 Messages 类型
│   └── index.ts           # 包入口，汇总导出
├── __tests__/             # 配置与键集合一致性
├── package.json           # exports "." -> ./src/index.ts
├── tsconfig.json          # 继承 base，Bundler 解析以读取 JSON
├── vitest.config.ts
├── README.md
├── CLAUDE.md
└── AGENTS.md
```

## 依赖与边界

- 零运行时依赖；`devDependencies` 只有 TypeScript、Vitest 与两个 workspace 配置包。
- 只放文案、语言常量与类型；不放 React Provider、切换组件、`localStorage` 读写或业务校验。
- 文案键按 `common` / `fields` / `auth` / `brand` / `meta` 命名空间组织；新增页面时先在 `zh-CN.json` 定键，再补 `en-US.json`。
- ICU 占位符（`{min}`、`{length}`、`{seconds}`）在中英两侧必须一致，由包内测试校验。

## 相关文档

- 根入口：[../../README.md](../../README.md)、[../../CLAUDE.md](../../CLAUDE.md)、[../../AGENTS.md](../../AGENTS.md)
- 文档同步规则：[../../.claude/rules/doc-sync.md](../../.claude/rules/doc-sync.md)
- 前端接入：[../../apps/frontend/CLAUDE.md](../../apps/frontend/CLAUDE.md)
