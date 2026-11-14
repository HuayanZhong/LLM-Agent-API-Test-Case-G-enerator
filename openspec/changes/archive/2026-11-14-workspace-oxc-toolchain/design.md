# Design

## Context

仓库是 pnpm monorepo，已有共享 tsconfig（`packages/typescript-config`）与共享 Vitest 配置（`packages/vitest-config`），根命令统一走 Turbo；但没有任何 lint / format 工具与配置。现有代码风格不统一：`apps/backend`、`apps/bff` 是 Nest 默认的单引号 + 分号，`apps/frontend`、`packages/ui` 与测试是双引号 + 无分号。

本次引入 Oxc 的质量工具 `oxlint`（1.93.0）与 `oxfmt`（0.78.0）。Vite 8 已经在测试链里用 Oxc 做 transform，本次不重复引入编译器，只补 lint 与格式化。动机与范围见 [proposal.md](proposal.md)。

规划阶段查阅的官方依据：

- oxlint 配置、插件、忽略与嵌套配置：<https://oxc.rs/docs/guide/usage/linter/config>、<https://oxc.rs/docs/guide/usage/linter/plugins>、<https://oxc.rs/docs/guide/usage/linter/ignore-files>、<https://oxc.rs/docs/guide/usage/linter/nested-config>
- oxlint type-aware：<https://oxc.rs/docs/guide/usage/linter/type-aware>
- oxfmt 配置、排序、忽略、语言支持、嵌入格式化：<https://oxc.rs/docs/guide/usage/formatter/config>、<https://oxc.rs/docs/guide/usage/formatter/sorting>、<https://oxc.rs/docs/guide/usage/formatter/ignore-files>、<https://oxc.rs/docs/guide/usage/formatter/language-support>、<https://oxc.rs/docs/guide/usage/formatter/embedded-formatting>
- Turbo 自带的 Oxc 指南：`node_modules/turbo/docs/guides/tools/oxc.mdx`

## Goals / Non-Goals

**Goals:**

- 用一份根配置覆盖全仓的 lint 与 format，命令可重复执行且幂等。
- 让 lint / format 接入现有 Turbo 任务体系，可在本地直接跑，也可在将来 CI 里走缓存。
- 用 `overrides` / `settings` 表达 React、Next.js、Nest、测试等不同文件边界的差异，不复制配置。
- 现有 tsconfig、Vitest、Storybook、build 行为不变。

**Non-Goals:**

- 不替换 Nest 的 `nest build`（继续 tsc）。
- 不启用 oxlint type-aware / type-check。
- 不引入 ESLint、Prettier、lint-staged、husky。
- 不格式化 Markdown 与 `doc/` 下的生成物。
- 不启用 import 排序与 Tailwind class 排序。

## Decisions

### D1. 用 oxlint + oxfmt，而不是 ESLint + Prettier

`oxlint` 原生实现 ESLint 生态常用插件，`oxfmt` 以 Prettier 输出为基线；两者都不需要一整套 JS 依赖树。仓库已有 Vite 8（内部用 Oxc），工具链同源。官方文档也把 oxlint / oxfmt 作为一组使用：<https://oxc.rs/docs/guide/usage/formatter/>。

替代方案：ESLint + Prettier。放弃，因为要额外维护 flat config、插件版本与 peer 依赖，而仓库目前没有既有的 ESLint 配置需要兼容。

### D2. 配置放根目录，不新增 `packages/oxc-config`

官方文档说明：

- oxlint 会自动寻找 `.oxlintrc.json` / `.oxlintrc.jsonc` / `oxlint.config.ts` / `oxlint.config.mts`，并对每个被 lint 的文件使用最近的配置：<https://oxc.rs/docs/guide/usage/linter/nested-config>
- oxfmt 同样从被格式化文件所在目录向上寻找 `.oxfmtrc.json` / `.jsonc` / `oxfmt.config.ts` / `.mts`，最近配置生效：<https://oxc.rs/docs/guide/usage/formatter/config>。
- Turbo 的 Oxc 指南建议把 oxlint / oxfmt 作为根任务运行：`node_modules/turbo/docs/guides/tools/oxc.mdx`。

因此根配置 + `overrides` / `settings` 已足够表达差异。`packages/typescript-config` 与 `packages/vitest-config` 需要包化，是因为每个包要有自己的 `include` / `paths` / `root` 语义；oxlint / oxfmt 没有这种 per-package 需求，再包一层只会多一次 re-export。

替代方案：`packages/oxc-config` + 根 `oxlint.config.ts` 引用。放弃，因为 `.oxlintrc.json` 的 `extends` 只接受相对路径，包导入必须改用实验性的 TS 配置；oxfmt 也没有 `extends`。收益不足以抵消复杂度。

### D3. 包级任务 + Turbo 汇总

每个 workspace 包在 `package.json` 里提供：

```json
"lint": "oxlint . --no-error-on-unmatched-pattern",
"lint:fix": "oxlint . --fix --no-error-on-unmatched-pattern",
"format": "oxfmt --check .",
"format:fix": "oxfmt ."
```

根 `package.json` 只做 Turbo 包装：

```json
"lint": "turbo run lint",
"lint:fix": "turbo run lint:fix",
"format": "turbo run format",
"format:fix": "turbo run format:fix"
```

`turbo.json`：

```json
"lint": { "dependsOn": ["^lint"] },
"lint:fix": { "cache": false, "dependsOn": ["^lint:fix"] },
"format": { "dependsOn": ["^format"] },
"format:fix": { "cache": false, "dependsOn": ["^format:fix"] }
```

理由：

- 每个包都能直接 `pnpm --filter <pkg> lint` / `format`，根命令一次汇总所有包，符合现有 `check-types` / `test` 的 `pnpm -> turbo` 习惯。
- 包级任务可以按包缓存；lint / format 互不影响。
- `lint:fix` / `format:fix` 会写文件，必须 `cache: false`。
- 根配置变更需要让包级 lint / format 缓存失效，用 `globalDependencies` 纳入 `.oxlintrc.json` / `.oxfmtrc.json`。

已知边界：根 `package.json`、`pnpm-workspace.yaml`、`turbo.json`、根 Markdown 不属于任何 workspace 包，`pnpm format` 不会覆盖它们；这些文件保持手工维护。若后续需要，单独加根级检查脚本。

替代方案：Turbo 根任务（`//#lint` 等）。放弃，因为用户希望每个包有自己的命令、根命令统一跑所有包，而不是只跑根任务。

### D4. oxlint：默认插件 + 框架插件，只开 `correctness`

官方插件表：`eslint`、`typescript`、`unicorn`、`oxc` 默认开启；`react`（含 react-hooks / react-refresh）、`import`、`jsx-a11y`、`nextjs`、`node`、`promise`、`vitest` 需要显式开启。`plugins` 会覆盖默认集合，因此列表必须包含默认插件：<https://oxc.rs/docs/guide/usage/linter/plugins>。

采用：

```json
"plugins": [
  "typescript", "unicorn", "oxc",
  "import", "react", "jsx-a11y", "nextjs", "vitest", "node", "promise"
],
"categories": { "correctness": "error" },
"options": { "maxWarnings": 0 }
```

- `categories` 默认就是 `correctness`；显式写成 `error` 让违规退出非零：<https://oxc.rs/docs/guide/usage/linter/config>。
- `maxWarnings: 0` 对应 `--max-warnings=0`，任何 warning 也失败：同上。
- 不开 `suspicious`：实测会带出 41 条 `react/react-in-jsx-scope` 误报（React 19 新 JSX runtime 不需要 `React` 在作用域），需要额外关闭，收益低。
- 关闭 `import/no-unassigned-import`：仓库里的 CSS side-effect import 与 `@testing-library/jest-dom/vitest` 是合法写法。
- Next.js 规则按官方 `settings.next.rootDir` 收敛到 `apps/frontend/`：<https://oxc.rs/docs/guide/usage/linter/config#plugin-settings>；若仍误报 `packages/ui`，用 `overrides` 关闭 `next/no-html-link-for-pages`。

### D5. 忽略策略

官方建议用配置里的 `ignorePatterns`，而不是单独的 ignore 文件；模式相对配置文件解析；`.gitignore` 在目录遍历时生效，隐藏文件不会自动忽略；oxfmt 还默认忽略 `node_modules` 与 lock 文件：<https://oxc.rs/docs/guide/usage/linter/ignore-files>、<https://oxc.rs/docs/guide/usage/formatter/ignore-files>。

两份配置共用这些忽略项：

```json
[".agents/**", ".claude/**", "doc/**", "openspec/**", "packages/ui/storybook-static/**"]
```

- `.agents` / `.claude`：技能资产与符号链接，不是本仓库代码。
- `doc`：HTML 是交付物，由 Archify 生成。
- `openspec`：规格与归档，不参与代码质量门禁。
- `storybook-static`：构建产物。

`dist`、`coverage`、`.next` 已在 `.gitignore` 中，按官方行为在遍历时跳过，不重复写。

### D6. oxfmt 基线

官方默认值：`printWidth: 100`、`tabWidth: 2`、`useTabs: false`、`semi: true`、`singleQuote: false`、`trailingComma: "all"`、`sortImports` 关闭、`sortTailwindcss` 关闭、`sortPackageJson` 开启：<https://oxc.rs/docs/guide/usage/formatter/config>、<https://oxc.rs/docs/guide/usage/formatter/sorting>。

采用：

```json
{
  "printWidth": 100,
  "semi": false,
  "singleQuote": false,
  "trailingComma": "all",
  "sortPackageJson": false,
  "sortImports": false,
  "sortTailwindcss": false
}
```

- `semi: false`：已在探索阶段确认，贴合现有 frontend / ui / 测试代码；backend 4 个源文件规范化。
- `singleQuote: false`：Oxfmt 默认，也是多数现有代码。
- `sortPackageJson: false`：默认开启会重排 `package.json` 的 key（`keywords` 排序、`homepage` / `bugs` / `repository` 位置变化），功能无影响但 diff 很吵。
- `sortImports` / `sortTailwindcss` 保持关闭：前者会影响 CSS side-effect import 的顺序，后者需要给 Tailwind v4 指定 `stylesheet` 与 `functions`；都属于后续可单独开启的能力。
- Oxfmt 会读取 `.editorconfig` 的 `indent_size` / `end_of_line` / `insert_final_newline`，与现有 2 空格、LF 配置一致：<https://oxc.rs/docs/guide/usage/formatter/config#editorconfig>。

### D7. Markdown 不纳入格式化

Oxfmt 原生支持 Markdown，并默认 `embeddedLanguageFormatting: "auto"`，会格式化 Markdown 代码块里的 JS/TS：<https://oxc.rs/docs/guide/usage/formatter/language-support>、<https://oxc.rs/docs/guide/usage/formatter/embedded-formatting>。

但本仓库的文档是中文，Oxfmt 会按全角字符宽度重排表格，视觉对齐会变差；同时文档代码块会被按 `semi: false` 改写。本次在 `.oxfmtrc.json` 忽略 `**/*.md`、`**/*.mdx`，只格式化代码与配置。后续如需统一文档排版，再单独开一个变更。

### D8. 暂不启用 type-aware

官方文档明确：type-aware linting 需要额外安装 `oxlint-tsgolint`，并且要求 TypeScript 7.0+，部分旧 `tsconfig` 选项（如 `baseUrl`）不支持：<https://oxc.rs/docs/guide/usage/linter/type-aware>。当前仓库是 TypeScript 6.0.3，且已有 `pnpm check-types` 覆盖类型错误，本阶段不启用。等 TS 7 升级后再评估 `options.typeAware` / `options.typeCheck`。

### D9. 不替换 Nest 构建

`nest build` 继续用 tsc。`oxc-transform` 虽然能生成 `design:paramtypes`，但替换 Nest 的构建链需要重新验证装饰器元数据、ESM 输出、`nest-cli.json` 的 `deleteOutDir` 与 assets 行为，收益是构建速度，不属于本次质量工具范围。Vitest 链路已经由 Vite 8 / Oxc 负责。

### D10. 现有问题的处理

oxlint 在现有代码上命中三类：

| 位置 | 规则 | 处理 |
|---|---|---|
| `packages/ui/vitest.config.ts` | `no-unused-vars` | 删除未使用的 `coverageConfigDefaults` 导入（真实问题） |
| `packages/ui/__tests__/utils.test.ts` | `no-constant-binary-expression` | 把 `false && "hidden"` 改为 `undefined`，保留「过滤 falsy class」的测试意图 |
| `packages/ui/__tests__/button.test.tsx` | `next/no-html-link-for-pages` | 用 `settings.next.rootDir` 收敛；若仍误报，override 关闭该规则 |

不为了让 lint 通过而放宽 `no-unused-vars` / `no-constant-binary-expression`。

### D11. 文档同步

按 `.claude/rules/doc-sync.md`，命令、依赖、任务变更需要同步：

- 根 `README.md`：命令、依赖说明、Oxc 段落、目录树中的两个配置文件。
- 根 `CLAUDE.md`：命令、Turbo 任务、仓库现状（去掉「lint 尚未接入」）。
- 根 `AGENTS.md`：入口索引。
- 各 workspace 包 `README.md` / `CLAUDE.md` / `AGENTS.md`：本包 lint / format 命令与边界。
- `packages/typescript-config/README.md`：把「ESLint / Prettier 后续接入」改为 Oxc 已接入。
- `openspec/config.yaml` 的 `context`：当前状态与技术栈。

## Risks / Trade-offs

- [Oxfmt 仍是 0.x，输出可能随版本变化] → 通过 `catalog:tooling` + `pnpm-lock.yaml` 固定版本；升级时单独跑 `format:fix` 并回归。
- [一次性格式化产生较大 diff，掩盖真实改动] → 先完成配置与代码修复，再单独跑一次 `format:fix`；用 `check-types` / `test` / 三个 build 回归。建议格式化作为独立提交。
- [`pnpm lint` / `pnpm format` 不经过 Turbo，与现有 `pnpm test` 的包装方式不同] → 在 README / CLAUDE 明确说明：本地直接跑，CI 用 `turbo run lint` / `turbo run format` 取缓存。
- [Next.js 规则在 `packages/ui` 误报] → 优先 `settings.next.rootDir`；不行再加 override，不放宽全局规则。
- [Markdown 不格式化，文档风格不统一] → 本次接受；后续单独变更开启，并先验证中文表格与代码块效果。
- [type-aware 未启用，部分类型相关 lint 缺失] → `pnpm check-types` 已覆盖类型错误；待 TypeScript 7 升级后再评估。
- [格式与 lint 可能触及生成文件] → 忽略 `apps/frontend/next-env.d.ts`、`storybook-static`；lock 文件由 Oxfmt 默认忽略。

## Migration Plan

1. 在 `pnpm-workspace.yaml` 的 `tooling` catalog 加入 `oxlint` / `oxfmt`，根 `devDependencies` 引用 catalog，`pnpm install`。
2. 新增 `.oxlintrc.json`、`.oxfmtrc.json`。
3. 修复 D10 中的两个真实问题与 Next 规则边界。
4. 根 `package.json` 增加四个脚本，`turbo.json` 增加四个根任务。
5. 跑 `pnpm format:fix` 完成一次性格式化，检查 diff 只包含排版变化。
6. 跑 `pnpm lint`、`pnpm format`、`pnpm check-types`、`pnpm test`、三个 build。
7. 同步 D11 的文档，跑 `pnpm exec openspec validate --all`。

回滚：本次不改变运行时行为；回滚只需 revert 对应提交并删除两个配置文件，依赖与 lockfile 一并回退。

## Open Questions

- 是否在后续变更中启用 `sortImports` 与 `sortTailwindcss`（需要先确认 CSS import 顺序与 Tailwind v4 stylesheet 配置）。
- 是否把 Markdown 纳入格式化，以及中文表格的呈现效果是否可接受。
- 是否在 CI 中同时跑 `turbo run lint` / `turbo run format` 以利用缓存；本次只保证命令可用。
