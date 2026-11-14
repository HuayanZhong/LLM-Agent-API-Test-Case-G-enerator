# Tasks

## 1. 依赖与配置骨架

- [x] 1.1 在 `pnpm-workspace.yaml` 的 `tooling` catalog 加入 `oxlint: ^1.93.0`、`oxfmt: ^0.78.0`，在根 `package.json` 的 `devDependencies` 用 `catalog:tooling` 引用；执行 `pnpm install`，用 `pnpm exec oxlint --version`、`pnpm exec oxfmt --version` 验证版本为 1.93.0 / 0.78.0
- [x] 1.2 新增根 `.oxlintrc.json`：包含 `plugins`、`categories`、`options.maxWarnings`、`ignorePatterns`、`settings.next.rootDir` 与必要 `overrides`；用 `pnpm exec oxlint . --debug=files` 验证配置可加载，且文件列表不含 `.agents`、`.claude`、`doc`、`openspec`、`storybook-static`
- [x] 1.3 新增根 `.oxfmtrc.json`：`printWidth: 100`、`semi: false`、`singleQuote: false`、`trailingComma: "all"`、`sortPackageJson: false`、`sortImports: false`、`sortTailwindcss: false`，并忽略 `.agents`、`.claude`、`doc`、`openspec`、`storybook-static`、`**/*.md`、`**/*.mdx`、`apps/frontend/next-env.d.ts`；用 `pnpm exec oxfmt --list-different .` 验证只列出代码/配置文件，不列出上述目录与 Markdown

## 2. 现有问题与规则边界

- [x] 2.1 删除 `packages/ui/vitest.config.ts` 中未使用的 `coverageConfigDefaults` 导入；用 `pnpm exec oxlint packages/ui` 验证 `no-unused-vars` 不再出现，`pnpm --filter @workspace/ui check-types` 仍通过
- [x] 2.2 把 `packages/ui/__tests__/utils.test.ts` 的 `false && "hidden"` 改为 `undefined`；用 `pnpm --filter @workspace/ui test` 验证测试通过且覆盖率仍达 95%，`pnpm exec oxlint packages/ui` 验证 `no-constant-binary-expression` 不再出现
- [x] 2.3 用 `settings.next.rootDir` 把 Next.js 规则收敛到 `apps/frontend/`，必要时为 `packages/ui` 增加 override；用 `pnpm exec oxlint packages/ui` 验证 `next/no-html-link-for-pages` 不再误报，并用一个临时的 `apps/frontend` 违规样例确认该规则在 frontend 仍然生效（验证后删除样例）

## 3. 命令、Turbo 与根文档

- [x] 3.1 根 `package.json` 增加 `lint`、`lint:fix`、`format`、`format:fix` 的 `turbo run` 包装脚本，每个 workspace 包的 `package.json` 增加同名脚本（`oxlint .` / `oxfmt .`）；用 `pnpm lint`、`pnpm format` 验证根命令一次跑完六个包并返回 0
- [x] 3.2 `turbo.json` 增加 `lint`、`lint:fix`、`format`、`format:fix` 任务，fix 任务 `cache: false`，并用 `globalDependencies` 纳入两个根配置文件；用 `pnpm turbo run lint --dry=json` 验证六个包任务被识别，连续两次 `pnpm turbo run lint` 验证第二次命中缓存
- [x] 3.3 执行一次 `pnpm format:fix`；用 `pnpm format` 验证格式化完成且幂等，用 `git diff --stat` 确认变化只涉及 TS / TSX / JS / JSON / YAML / CSS，不包含 Markdown
- [x] 3.4 同步根 `README.md`：命令块加入 `pnpm lint` / `lint:fix` / `format` / `format:fix`，目录树加入两个配置文件，补 Oxc 段落；验证 README 中每条命令都能按写法执行
- [x] 3.5 同步根 `CLAUDE.md` 与 `AGENTS.md`：命令、Turbo 任务、仓库现状去掉「lint 尚未接入」，加入 Oxc 入口；验证文档中的路径与脚本名真实存在
- [x] 3.6 同步 `openspec/config.yaml` 的 `context`：当前状态改为「lint / format 已接入 Oxlint / Oxfmt，业务模块尚未接入」，技术栈加入 Oxc；用 `pnpm exec openspec context --json` 验证文件仍可解析

## 4. 包级文档

- [x] 4.1 更新 `apps/frontend/README.md` / `CLAUDE.md` / `AGENTS.md`：加入 `pnpm --filter frontend lint` / `format`（根配置）与本包格式化边界；验证三份文件中的相对链接可达
- [x] 4.2 更新 `apps/backend/README.md` / `CLAUDE.md` / `AGENTS.md` 与 `apps/bff/README.md` / `CLAUDE.md` / `AGENTS.md`：加入包级 `lint` / `format` 命令，并说明 Nest 源文件已统一为 `semi: false` 风格；验证三份文件中的相对链接可达
- [x] 4.3 更新 `packages/ui/README.md` / `CLAUDE.md` / `AGENTS.md`：加入包级 `lint` / `format` 命令，说明组件与 Storybook 代码的 lint / format 由根配置负责，Next 规则不适用于本包；验证三份文件中的相对链接可达
- [x] 4.4 更新 `packages/typescript-config/README.md` / `CLAUDE.md` / `AGENTS.md` 与 `packages/vitest-config/README.md` / `CLAUDE.md` / `AGENTS.md`：加入包级 `lint` / `format` 命令，把「ESLint / Prettier 后续接入」改为「lint / format 由根目录 Oxlint / Oxfmt 负责」；验证三份文件中的相对链接可达

## 5. 集成验证

- [x] 5.1 依次执行 `pnpm lint:fix`、`pnpm lint`、`pnpm format:fix`、`pnpm format`，验证四条命令都返回 0 且第二次检查无改动
- [x] 5.2 执行 `pnpm check-types` 与 `pnpm test`，验证 5/5 类型检查任务通过、4/4 测试任务通过且行覆盖率仍为 95% 门槛以上
- [x] 5.3 执行 `pnpm --filter frontend build`、`pnpm --filter backend build`、`pnpm --filter bff build`，验证三个构建都返回 0，且 `dist` 中不包含测试文件
- [x] 5.4 执行 `pnpm exec openspec validate --all` 与 `pnpm exec openspec status --change "workspace-oxc-toolchain"`，验证校验通过、proposal / design / tasks 均为 done、specs 为 skipped
- [x] 5.5 用 `pnpm exec oxlint . --debug=files` 与 `pnpm exec oxfmt --list-different .` 复查忽略项，确认 `.agents`、`.claude`、`doc`、`openspec`、Markdown 均未进入扫描/格式化范围

## Workflow follow-up

- 计划评审通过后，按 `openspec-apply-change` 实施。
- 实施与验证完成后，按 `openspec-archive-change` 归档到 `openspec/changes/archive/`。
