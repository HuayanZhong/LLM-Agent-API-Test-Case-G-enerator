# Proposal

## Why

四个 workspace 包即将陆续写测试，但仓库还没有测试框架。若每个包各自安装 Vitest、各自写一份配置与文件约定，就会重演 TypeScript 配置的问题：同一事实多份拷贝，后续接入 oxc / lint 时三套工具链互相牵制。Vitest 5 的 Test Projects 要求仓库根配置，且「以文件或目录引用的项目不继承根配置」；Turborepo 的缓存又按包边界生效，所以逐包配置、共享 profile 才是与当前仓库一致的做法。论文还要求行覆盖率不低于 95%，需要从一开始就把 provider 与阈值写进共享配置，而不是等测试铺开后再补。趁业务代码还没落地，先把测试配置收口，再挂到 Turbo 的 `test` 任务上。

## What Changes

- 新增 `packages/vitest-config`（包名 `@workspace/vitest-config`），提供两个共享 profile：`base`（Node 环境）与 `react`（jsdom）。包内只发源码、不做 build，形态与 `packages/typescript-config` 对齐。
- 四个包新增 `vitest.config.ts`、`test` / `test:watch` 脚本与 `vitest` 依赖；`apps/backend` 与 `apps/bff` 另加 `@nestjs/testing`，`apps/frontend` 与 `packages/ui` 另加 `jsdom`、`@testing-library/react`、`@testing-library/dom`、`@testing-library/jest-dom`，以及 `@vitejs/plugin-react`。路径别名统一用 Vite 8 原生 `resolve.tsconfigPaths`；Next 指南里的 `vite-tsconfig-paths` 因 `tsconfck` 与 TS 6 的 peer 冲突被替换。
- 按各栈官方约定放置测试文件：Nest 单元测试就近放 `src/**/*.spec.ts`，e2e 后续放 `test/**/*.e2e-spec.ts`；frontend 与 ui 沿用 Next 指南的 `__tests__/**/*.test.tsx` 约定。
- 按路径语义划边界：`include` / `setupFiles` / `root` / 别名与插件留在各包；共享包只放无路径语义的 `test` 选项。
- `packages/ui` 的 `tsconfig.json` 把 `__tests__` 与 `vitest.config.ts` 纳入类型检查；Nest 两个包的 `tsconfig.build.json` 现有 exclude 已覆盖 `test` 与 `**/*spec.ts`，不再改动。
- 覆盖率门槛：共享 profile 配置 `@vitest/coverage-v8`，四个包的 `test` 脚本改为 `vitest run --coverage`，`coverage.thresholds.lines` 为 **95%**；functions / branches / statements 只进报告、不参与失败判定。`coverage.include` 与框架入口排除留在各包（路径项）。
- 每个包补上能让门槛通过的最小测试集：backend / bff 用 `@nestjs/testing` 起 `AppModule`，frontend 覆盖 `page` 与 `theme-provider`，ui 覆盖 `Button` 的各 variant / `asChild`、`Card` 组合与 `cn` 工具，用来同时证明测试栈可运行与覆盖率达标。
- `turbo.json` 注册 `test`（可缓存、`outputs: ["coverage/**"]`）与 `test:watch`（persistent、不缓存）两个任务；根 `package.json` 暴露 `test` / `test:watch`。
- `pnpm-workspace.yaml` 新增 `testing` catalog（Vitest、`@vitest/coverage-v8`、jsdom、Testing Library、Vite React 插件），并把 `vite` 从 `storybook` catalog 移到 `tooling`，供 Vitest 的必选 peer 统一版本。
- 按文档同步规则补 `packages/vitest-config` 的 `README.md` / `CLAUDE.md` / `AGENTS.md`，并同步根 `README.md` / `CLAUDE.md` / `AGENTS.md`、四个包的 `CLAUDE.md` 与 `openspec/config.yaml` 的 `context`。
- 明确不做：不做合并覆盖率报告与 CI 上传（每包独立门槛）；不引入 `@storybook/addon-vitest`、Playwright、浏览器模式；不引入 oxlint / Prettier；不写业务模块的正式测试；不改端口、启动方式与构建产物。

## Capabilities

### New Capabilities

无。本次只接入测试工具链，不改变任何可观察的系统行为，`skip_specs: true`。

### Modified Capabilities

无。

## Impact

- 新增：`packages/vitest-config/`（`src/index.ts` + 包级文档）。
- 修改：`apps/frontend`、`apps/bff`、`apps/backend`、`packages/ui` 的 `package.json`、`tsconfig.json`（仅 ui）与新增的 `vitest.config.ts` / 测试文件 / setup 文件。
- 修改：根 `package.json`、`turbo.json`、`pnpm-workspace.yaml`、根 `README.md` / `CLAUDE.md` / `AGENTS.md`、四个包的 `CLAUDE.md`、`openspec/config.yaml`。
- 依赖：新增 `vitest`、`@vitest/coverage-v8`、`jsdom`、`@testing-library/*`、`@vitejs/plugin-react`、`@nestjs/testing`；`vite` 改由 `tooling` catalog 管理；不新增构建脚本或平台二进制依赖。
- 风险：Vitest 5 以 Vite 8 为 peer，Vite 8 用 Oxc 生成装饰器元数据（不再需要 SWC），但需要 apply 阶段用 Nest 冒烟测试实证；共享包只发 `.ts` 依赖 Node 26 的类型剥离，需在 `pnpm check-types` 与四包 `test` 中同时验证。
