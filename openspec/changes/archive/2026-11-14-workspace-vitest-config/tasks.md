# Tasks

## 1. 共享配置包与依赖

- [x] 1.1 `pnpm-workspace.yaml` 新增 `testing` catalog（`vitest` / `@vitest/coverage-v8` / `jsdom` / `@testing-library/react` / `@testing-library/dom` / `@testing-library/jest-dom` / `@vitejs/plugin-react`），把 `vite` 从 `storybook` 移到 `tooling`；`packages/ui/package.json` 的 vite 引用改为 `catalog:tooling`。验证：catalog 键名与包内引用一致，`pnpm-workspace.yaml` 能被 pnpm 解析。
- [x] 1.2 创建 `packages/vitest-config/package.json`（`@workspace/vitest-config`、`private`、`type: module`、`exports: { ".": "./src/index.ts" }`、`check-types` 脚本、`vitest` / `typescript` / `@workspace/typescript-config` 三个 devDependencies）与 `tsconfig.json`（`extends "@workspace/typescript-config/base.json"`、`include: ["src"]`）。验证：两个文件为合法 JSON，`tsconfig.json` 的 extends 路径存在。
- [x] 1.3 按 design D2 / D3 / D10 写 `src/index.ts`：`base` 与 `react` 两个命名导出；`base.test.coverage` 配 `provider: "v8"`、`reporter: ["text", "html"]`、`thresholds: { lines: 95 }`（其余三项只报告）；包内不写相对 import、不引入运行时依赖。验证：`pnpm --filter @workspace/vitest-config check-types` 退出码 0。
- [x] 1.4 跑 `pnpm install`，确认四个消费包都出现 `node_modules/@workspace/vitest-config` 符号链接、`@vitest/coverage-v8` 解析到 5.1.x、`node_modules/.pnpm` 中只有一份 `vite@8.3.8`。验证：`ls -la apps/backend/node_modules/@workspace`、`pnpm why vite`、`pnpm why @vitest/coverage-v8`。
- [x] 1.5 补包级 `README.md` / `CLAUDE.md` / `AGENTS.md`，按 [.claude/rules/doc-sync.md](../../../.claude/rules/doc-sync.md) 的固定章节；README 写 profile 对照表、「只发源码、无 build」与 95% 行覆盖率门槛，CLAUDE 写路径边界与 Node 26 的类型剥离前提。验证：相对链接可达，profile 表与 `src/index.ts` 一致。

## 2. backend 接入（Nest 官方口径）

- [x] 2.1 `apps/backend` 新增 `vitest.config.ts`（`...base` + `resolve: { tsconfigPaths: true }` + `test.include: ["src/**/*.spec.ts"]` + `coverage: { ...base.test.coverage, include: ["src/**/*.ts"], exclude: [...coverageConfigDefaults.exclude, "src/main.ts"] }`，`coverageConfigDefaults` 从 `vitest/config` 导入），`package.json` 把 `test` 改为 `vitest run --coverage`、加 `test:watch`，并加 `vitest` / `@vitest/coverage-v8` / `vite` / `@workspace/vitest-config` / `@nestjs/testing` 依赖。验证：`pnpm --filter backend test` 能启动并输出覆盖率表（此时允许 0 tests 之外的失败仅来自未达阈值）。
- [x] 2.2 新增 `apps/backend/src/app.controller.spec.ts`：`Test.createTestingModule({ imports: [AppModule] })` 编译后取 `AppController`，断言 `health()` 返回 `{ status: "ok", service: "backend" }`；与 Nest 官方模板一样从 `./app.controller.js` 导入。验证：`pnpm --filter backend test` 用例通过，行覆盖率 ≥ 95%（其余三项看报告）。
- [x] 2.3 `pnpm --filter backend build` 后检查 `dist` 不含 spec 文件。验证：`find apps/backend/dist -name "*spec*"` 无输出，构建退出码 0。
- [x] 2.4 更新 `apps/backend/CLAUDE.md`：命令表补 `test` / `test:watch`，写明单元测试在 `src/**/*.spec.ts`、e2e 后续在 `test/**/*.e2e-spec.ts`、95% 行覆盖率门槛、`src/main.ts` 排除与 `types` 不引入 `vitest/globals` 的原因。验证：文档中的命令实际可跑，位置说明与 2.1 / 2.2 一致。

## 3. bff 接入（Nest 官方口径）

- [x] 3.1 `apps/bff` 做与 2.1 相同的配置与依赖改动（include / exclude 相同）。验证：`pnpm --filter bff test` 能启动并输出覆盖率表。
- [x] 3.2 新增 `apps/bff/src/app.controller.spec.ts`，断言 `health()` 返回 `{ status: "ok", service: "bff" }`。验证：`pnpm --filter bff test` 至少 1 个用例通过，行覆盖率 ≥ 95%（其余三项看报告）。
- [x] 3.3 `pnpm --filter bff build` 后确认 `dist` 无 spec 文件。验证：`find apps/bff/dist -name "*spec*"` 无输出。
- [x] 3.4 更新 `apps/bff/CLAUDE.md`（与 2.4 同口径，端口与包名按 bff 调整）。验证：文档命令可跑。

## 4. frontend 接入（Next 官方口径）

- [x] 4.1 `apps/frontend` 新增 `vitest.config.ts`（`...react` + `plugins: [react()]` + `resolve: { tsconfigPaths: true }` + `test.include: ["__tests__/**/*.test.tsx"]` + `test.setupFiles: ["./__tests__/setup.ts"]` + `coverage: { ...base.test.coverage, include: ["src/**/*.ts", "src/**/*.tsx"], exclude: [...coverageConfigDefaults.exclude, "src/app/layout.tsx"] }`，`coverageConfigDefaults` 从 `vitest/config` 导入），`package.json` 把 `test` 改为 `vitest run --coverage`、加 `test:watch`，并补 `vitest` / `@vitest/coverage-v8` / `vite` / `jsdom` / `@testing-library/*` / `@vitejs/plugin-react` / `@workspace/vitest-config` 依赖。验证：`pnpm --filter frontend test` 能启动并输出覆盖率表。
- [x] 4.2 新增 `apps/frontend/__tests__/setup.ts`：引入 `@testing-library/jest-dom/vitest`，注册 `afterEach(cleanup)`。验证：`pnpm --filter frontend check-types` 退出码 0。
- [x] 4.3 新增 `apps/frontend/__tests__/page.test.tsx`：`import Page from "@/app/page"`，`render(<Page />)` 后断言标题「前端骨架已就绪」与按钮文本。验证：用例通过，`page.tsx` 进入覆盖率报告。
- [x] 4.4 新增 `apps/frontend/__tests__/theme-provider.test.tsx`：渲染 `ThemeProvider` + 子节点，断言子节点可见。验证：用例通过，`theme-provider.tsx` 进入覆盖率报告。
- [x] 4.5 `pnpm --filter frontend test` 的行覆盖率 ≥ 95%。验证：终端 `coverage` 汇总表里 lines ≥ 95，functions / branches / statements 只做记录；未排除 `layout.tsx` 之外的源码全部计入。
- [x] 4.6 `pnpm --filter frontend build` 退出码 0，确认测试文件只参与类型检查、不进入产物。验证：构建成功，`.next` 中无测试入口。
- [x] 4.7 更新 `apps/frontend/CLAUDE.md`：补测试命令、`vitest.config.ts` 与 `__tests__/setup.ts` 的位置、`__tests__` 约定、95% 行覆盖率门槛与 `layout.tsx` 排除原因；注明 Next 对 async Server Components 的限制（后续用 e2e）。验证：文档命令可跑。

## 5. ui 接入（同一套 `__tests__` 约定）

- [x] 5.1 `packages/ui` 新增 `vitest.config.ts`（`...react` + `plugins: [react()]` + `resolve: { tsconfigPaths: true }` + `test.include: ["__tests__/**/*.test.tsx"]` + `test.setupFiles: ["./__tests__/setup.ts"]` + `coverage: { ...base.test.coverage, include: ["src/**/*.ts", "src/**/*.tsx"] }`），`package.json` 把 `test` 改为 `vitest run --coverage`、加 `test:watch` 与 4.1 同组依赖；`tsconfig.json` 的 `include` 增加 `vitest.config.ts` 与 `__tests__`。验证：`pnpm --filter @workspace/ui test` 能启动并输出覆盖率表，`check-types` 退出码 0。
- [x] 5.2 新增 `packages/ui/__tests__/setup.ts`（内容与 4.2 一致）与 `packages/ui/__tests__/button.test.tsx`：分别渲染默认 `Button` 与 `asChild` 用法，断言 `role="button"` 与插槽语义。验证：用例通过，`asChild` 三元分支被覆盖。
- [x] 5.3 新增 `packages/ui/__tests__/card.test.tsx`（用 `Card` + `CardHeader` / `CardTitle` / `CardDescription` / `CardAction` / `CardContent` / `CardFooter` 组合渲染）与 `packages/ui/__tests__/utils.test.ts`（`import { cn } from "@workspace/ui/lib/utils"` 并断言样式合并）。验证：两个文件用例通过，`card.tsx` 与 `utils.ts` 进入覆盖率报告。
- [x] 5.4 `pnpm --filter @workspace/ui test` 的行覆盖率 ≥ 95%。验证：终端汇总表里 lines ≥ 95，其余三项只做记录；`src` 下无排除项。
- [x] 5.5 更新 `packages/ui/CLAUDE.md`：把「不引入 Vitest」改为「Vitest 已接入，测试放 `__tests__/`，行覆盖率 ≥ 95%」；保留「不引入 `@storybook/addon-vitest`、Playwright」的限制，并注明 `src/` 仍只放发布源码。验证：内容与 5.1 – 5.4 的实际目录和门槛一致。

## 6. Turbo 与根脚本

- [x] 6.1 `turbo.json` 注册 `test`（`dependsOn: ["^test"]`、`outputs: ["coverage/**"]`）与 `test:watch`（`cache: false`、`persistent: true`）；根 `package.json` 加 `"test": "turbo run test"` 与 `"test:watch": "turbo run test:watch"`。验证：`pnpm test` 退出码 0，输出包含四个包的任务与覆盖率表；连续第二次运行命中缓存，四个包的 `coverage/` 被恢复。
- [x] 6.2 启动 `pnpm test:watch`，确认四个包进入 watch、进程不退出后手动中断，且 watch 不产出覆盖率。验证：终端显示 persistent 任务，`coverage/` 未被更新。

## 7. 文档同步与集成验证

- [x] 7.1 同步根 `README.md`（目录树、命令表、包表新增 `packages/vitest-config`、官方测试文件约定与 95% 行覆盖率门槛）、`CLAUDE.md`（命令、turbo 任务、结构）、`AGENTS.md`（测试入口）与 `openspec/config.yaml` 的 `context`（把「测试尚未接入」改为已接入、写明 `pnpm test` 与覆盖率门槛）。验证：README 的命令实际可跑，doc-sync 收尾清单逐项通过。
- [x] 7.2 集成验证：干净执行 `pnpm install`、`pnpm check-types`、`pnpm test`、`pnpm --filter frontend build`、`pnpm --filter backend build`、`pnpm --filter bff build`、`pnpm exec openspec validate --all`，全部退出码 0；确认四个包各有一份 `coverage/index.html`、行覆盖率 ≥ 95%（其余三项见报告），没有新增未跟踪产物，`node_modules/.pnpm` 只有一份 Vite。

## Workflow follow-up

- 按项目评审要求确认后，归档该变更。
