# Design

## Context

现状与约束（动机见 proposal.md - Why）：

- 仓库没有测试框架，也没有任何 `test` 脚本；`pnpm-workspace.yaml` 里 `testing` catalog 仍是注释占位。
- Node 26.12.1（`engines` 锁定 `>=26.12.1`、`engineStrict: true`），pnpm 12；workspace 包的依赖是符号链接。
- `vite@8.3.8` 当前只由 `packages/ui` 经 `catalog:storybook` 安装；Vitest 5 把 `vite` 列为**必选** peer，`jsdom` 等为可选 peer。
- `packages/typescript-config` 已提供 `base` / `nextjs` / `react-library` / `nestjs` 四个 profile，根 `pnpm check-types` 经 Turbo 执行。本方案沿用同样的收口方式。
- `apps/backend` / `apps/bff` 是 ESM NestJS，`tsconfig.build.json` 的 `exclude` 目前只有 `**/*spec.ts`，`include` 只有 `src`。
- Turborepo 2.11.11 自带文档 `node_modules/turbo/docs/guides/tools/vitest.mdx` 明确给出两条路线，并推荐在 monorepo 里优先逐包任务以保留缓存。
- `packages/ui/CLAUDE.md` 目前写着「不引入 @storybook/addon-vitest、Vitest、Playwright；等统一测试栈后另开变更」。本次只解除 Vitest 限制，addon-vitest 仍不做。
- `@nestjs/schematics` 12.0.13 的 `ts-esm` 模板本身已经使用 Vitest + Vite 8：单元测试在 `src/**.spec.ts`，e2e 在 `test/**.e2e-spec.ts`，并带 `vitest.config.ts` / `vitest.config.e2e.ts`。这是本次「遵循官方」的基线。
- Next.js 官方 Vitest 指南（canary docs `testing/vitest.mdx`）把测试放 `__tests__/page.test.tsx`，同时注明也可以就近放在 app 内；配置用 `@vitejs/plugin-react` + `vite-tsconfig-paths`。apply 时 Vite 8 提示路径解析已原生支持（`resolve.tsconfigPaths`），且 `vite-tsconfig-paths` 依赖的 `tsconfck` 与 TypeScript 6 存在 peer 冲突，因此改用 Vite 原生选项。

查证来源（apply 阶段可按同样路径复核）：

- `node_modules/turbo/docs/guides/tools/vitest.mdx`：projects 模式不能与包边界缓存共存；官方示例是 `packages/vitest-config` + 逐包 `test` 脚本。
- Vitest 5.1.0 文档（`docs/guide/projects.md`、`docs/config/setupfiles.md`、`docs/config/include.md`、`docs/config/root.md`、`docs/config/globals.md`）与包内 `dist/config.d.ts`。
- Vite 8.3.8 `dist/node/chunks/node.js` 的 `bundleConfigFile`、`vite:oxc` 插件与 `transformWithOxc` 实现。
- Rolldown 1.2.19 的 `transformSync` / `TsconfigCache` 与本机探针。

## Goals / Non-Goals

**Goals:**

- 四个包用同一套 Vitest 行为开关，新增测试时只关心本包的路径与文件。
- `pnpm test` 可并行、可缓存；watch 模式单独一个入口。
- 行覆盖率（`lines`）每包不低于 95%，不达标时命令失败；functions / branches / statements 照常输出到报告，但不作为失败条件。
- 测试文件位置、命名、类型检查与构建排除一次说清，后续业务测试直接照做。
- 不引入 SWC / 浏览器模式 / 合并覆盖率报告等重型依赖。

**Non-Goals:**

- 不做合并覆盖率报告（Turborepo 的包边界与 Vitest 的 `--merge-reports` 是另一套流程）；每包独立出报告、独立卡 95% 行覆盖率。
- 不做 Storybook `addon-vitest`、Playwright、Vitest Browser Mode。
- 不做 oxlint / Prettier；不替换现有 `check-types`。
- 不写业务模块的正式测试，只把当前骨架覆盖到门槛。
- 不改端口、启动方式、构建产物与 Nest/Next 的编译配置（只补测试文件的排除/包含）。

## Decisions

### D1. 逐包配置 + Turbo，不用根 `test.projects`

`turbo run test` 以包为缓存边界；Vitest 的 projects 模式把所有项目塞进一个根进程，Turborepo 只能把它当根任务，任何包改动都会让缓存整体失效。Turborepo 自带文档把这条列为权衡之一。

- 采用：每个包一个 `vitest.config.ts`，`turbo.json` 注册 `test`。
- 备选：根 `vitest.config.ts` + `test.projects` 指向 `apps/*`、`packages/*`。否决：缓存粒度变成整个仓库；且 Vitest 文档明确「以文件或目录引用的项目不继承根配置」，共享项仍要另找文件。
- 后续若确实需要合并覆盖率，再加独立的根 projects 配置，不影响逐包 `test`。

### D2. 两个 profile：`base` 与 `react`

```
@workspace/vitest-config
        |
   +----+----+
   v         v
 base      react
 (node)    (jsdom)
   |         |
backend    frontend
bff        ui
```

- `base`：`test.environment: "node"`、`test.clearMocks: true`、`test.passWithNoTests: true`，以及覆盖率公共项（`provider: "v8"`、`reporter: ["text", "html"]`、`thresholds: { lines: 95 }`）。`coverage.enabled` 保持默认 `false`，由 `test` 脚本的 `--coverage` 打开，避免 watch 模式每次收集。
- `react`：在 `base` 上只覆盖 `test.environment: "jsdom"`。
- 不设 `nestjs` profile：Nest 的差异来自 tsconfig（装饰器元数据），Vitest 侧没有额外开关，强行造一个空 profile 只会增加误导。

路径语义边界（与 `typescript-config` 的 D3 同一套判断）：

| 配置项 | 位置 | 原因 |
|---|---|---|
| `test.environment` / `clearMocks` / `passWithNoTests` | 共享包 | 纯行为开关 |
| `coverage.provider` / `reporter` / `thresholds` | 共享包 | 纯行为开关，四个包同一门槛 |
| `coverage.include` / `coverage.exclude` | 各包 | glob 相对包根解析；排除项（`src/main.ts`、`src/app/layout.tsx`）只在对应包成立 |
| `test.include` | 各包 | glob 相对 `root` 解析；各包目录不同 |
| `test.setupFiles` | 各包 | Vitest 源码为 `resolvePath(file, root)`，相对路径按包根解析；跨包共享只能用绝对路径，得不偿失 |
| `test.root` | 不显式设置 | 包内执行时默认就是包目录；显式写死反而限制 `--root` 覆盖 |
| `resolve.tsconfigPaths` | 各包 | Vite 8 原生读取 tsconfig paths；四个包共用同一选项，不引入插件 |
| `testTimeout` / `sequence` | 暂不提取 | 目前没有 e2e；出现真实需求时在对应 profile 加，避免提前抽象 |

### D3. 共享包只发源码，不做 build

`packages/vitest-config` 只有一个入口 `src/index.ts`，用命名导出提供 `base` 与 `react`，不生成 `dist`。这样它与 `packages/typescript-config` 一样「没有构建产物」，改 profile 不需要先 build。

可行性依据：

- Vitest 读取配置走 Vite 8 的 `resolveConfig` → `bundleConfigFile`。Vite 8 的 `externalize-deps` 会把能解析的裸导入解析成绝对路径并标记 `external`，所以 `@workspace/vitest-config` 不会被内联，而是交给 Node 在运行时加载。
- Node 26.12.1 本机探针：pnpm 风格的符号链接指向 `packages/vitest-config` 时，Node 会把真实路径解析到 `node_modules` 之外，`.ts` 出口可直接加载（`LOADED {"environment":"node"}`）；同一个包如果以真实目录形式放在 `node_modules` 内，会报 `ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING`。pnpm workspace 使用符号链接，命中前者。
- 包内**不写相对 import**。Node 的 ESM 不会把 `./base.js` 重写成 `./base.ts`；写 `./base.ts` 又要求消费方开启 `allowImportingTsExtensions`，而 Nest 的 `nest build` 会 emit，不能开。因此把两个 profile 放在同一个文件里，用对象展开复用 `base`。
- `import type { ViteUserConfig } from "vitest/config"` 只用于 `satisfies`，类型剥离后不产生运行时 import；`vitest` 作为 `devDependencies` 只为类型检查。

备选：

- `tsc` 产出 `dist`（Turborepo 官方示例）：最稳，但多一个 `build` 任务、`test` 要依赖 `@workspace/vitest-config#build`，配置包从「纯数据」变成「需要构建」，与 tsconfig 包不一致。
- 手写 `.js` + `.d.ts`：无构建也无类型剥离依赖，但要维护两份类型，profile 改动容易漏。

风险与回退：若 apply 时 `tsc` 报 TS5097 或 Vitest 加载 `.ts` 出口失败，按备选一改成 `tsc` 构建，改动只落在配置包与 `turbo.json` 的依赖边上。

### D4. Nest 装饰器元数据交给 Vite 8 / Oxc，不引入 SWC

`@nestjs/testing` 的隐式注入依赖 `emitDecoratorMetadata` 生成的 `design:paramtypes`。Vitest 旧版用 esbuild，无法输出该元数据，社区结论是改用 `unplugin-swc`（vitest-dev/vitest#708，2022 年关闭时建议 SWC）。

Vite 8 的转换链已换成 Rolldown/Oxc：

- `vite:oxc` 对 `.ts` / `.tsx` 调用 Rolldown 的 `transformSync`，并传 `TsconfigCache`，即按文件位置解析 `tsconfig.json`。
- 本机探针（Rolldown 1.2.19 + 与 `nestjs.json` 相同的 tsconfig）输出：
  `_decorateMetadata("design:paramtypes", [typeof SomeDep === "undefined" ? Object : SomeDep])`。
- Oxc 生成的 `@oxc-project/runtime` helpers 由 Rolldown 的 `builtin:oxc-runtime` 插件注入；Vite 对非打包环境（Vitest 正是）启用该插件。
- Oxc 同时读取 tsconfig 的 `jsx`，探针确认自动注入 `react/jsx-runtime`，因此 React 测试也不需要 `@vitejs/plugin-react`。

结论：不新增 `@swc/core`、`unplugin-swc`，也不改 `pnpm-workspace.yaml` 的 `allowBuilds`。Nest 12 官方 ESM 模板本身就是 Vitest 4 + Vite 8、没有 SWC，与本机探针一致。

风险与回退：apply 阶段必须用 Nest 冒烟测试实证；若 `Test.createTestingModule` 仍拿不到依赖，回退到 `unplugin-swc`（`swc.vite()` 会自动从 tsconfig 读取 `experimentalDecorators` 与 `emitDecoratorMetadata`），代价是配置包增加 SWC 依赖并在 `allowBuilds` 放行 `@swc/core` 的 postinstall。

### D5. 测试文件约定：按各栈官方约定

| 包 | 单元/组件测试 | 后续 e2e | 依据 |
|---|---|---|---|
| `apps/backend` | `src/**/*.spec.ts` | `test/**/*.e2e-spec.ts` | Nest 12 ESM 模板（`@nestjs/schematics` 的 `ts-esm`） |
| `apps/bff` | 同上 | 同上 | 与 backend 一致 |
| `apps/frontend` | `__tests__/**/*.test.tsx` | 不涉及 | Next.js 官方 Vitest 指南的 `__tests__` 约定 |
| `packages/ui` | `__tests__/**/*.test.tsx` | 不涉及 | 沿用同一套 `__tests__` 约定；`src/` 只留发布源码 |

Nest 模板的细节值得照抄：单元测试与源码同目录、文件名 `*.spec.ts`；e2e 在 `test/`、文件名 `*.e2e-spec.ts`；`tsconfig.build.json` 的 exclude 已包含 `test` 与 `**/*spec.ts`。本次只接单元部分，e2e 的 `vitest.config.e2e.ts`、supertest 与 `test:e2e` 脚本留到业务模块出现时再加。

Next 指南的细节：官方示例把测试放 `__tests__/page.test.tsx`，并注明「也可以就近放在 app 内」；配置用 `@vitejs/plugin-react` + `vite-tsconfig-paths`。我们采用 `__tests__` 这一支，因为它和 Nest 的 `test/` 一样，避免把测试混进 `src/`；路径别名按 apply 的验证结果改用 Vite 8 原生 `resolve.tsconfigPaths`，不再引入 `vite-tsconfig-paths`。

联动改动：

- `apps/backend` / `apps/bff` 的 `tsconfig.json`（默认 include）已覆盖 `src` 与 `test`；`tsconfig.build.json` 现有 exclude 已含 `test` 与 `**/*spec.ts`，**不需要改**。
- `packages/ui/tsconfig.json` 的 `include` 增加 `vitest.config.ts` 与 `__tests__`；否则这两个位置不参与类型检查。
- `apps/frontend/tsconfig.json` 的 `include` 已是 `**/*.ts` / `**/*.tsx`，`vitest.config.ts` 与 `__tests__` 自动纳入；`next build` 的类型检查会覆盖测试文件。
- 官方 Nest 模板用 `globals: true` + `types: ["vitest/globals"]`；本方案保留 `globals: false`（显式 import），理由见 D6，也与既有 `nest build` 约束一致。

### D6. 不用 `globals`，setup 文件留在各包

- `globals: false`（Vitest 默认），测试文件显式 `import { describe, it, expect } from "vitest"`。`apps/backend/CLAUDE.md` 已记录过「把 `vitest/globals` 加进 `types` 会让 `nest build` 失败」，显式导入可以彻底避开这条坑。
- `@testing-library/react` 的自动 cleanup 依赖全局 `afterEach`。关闭 globals 后，在 setup 文件里显式注册：

```ts
import "@testing-library/jest-dom/vitest"
import { cleanup } from "@testing-library/react"
import { afterEach } from "vitest"

afterEach(() => cleanup())
```

- setup 文件位置：`apps/frontend/__tests__/setup.ts`、`packages/ui/__tests__/setup.ts`；`setupFiles` 相对包根解析，符合 D2 的路径边界。

### D7. 依赖与版本

`pnpm-workspace.yaml` 新增：

```yaml
testing:
  vitest: ^5.1.0
  "@vitest/coverage-v8": ^5.1.0
  jsdom: ^31.0.1
  "@testing-library/react": ^16.3.3
  "@testing-library/dom": ^10.4.2
  "@testing-library/jest-dom": ^6.9.1
  "@vitejs/plugin-react": ^6.3.0
```

- `vite` 从 `storybook` catalog 移到 `tooling`（仍是 `^8.3.8`），`packages/ui` 改为 `catalog:tooling`；四个装了 `vitest` 的包显式声明 `"vite": "catalog:tooling"`，满足 Vitest 的必选 peer，避免 pnpm 自动安装出第二份 Vite。
- `@vitest/coverage-v8` 与 `vitest` 是精确 peer（`5.1.0`），两者都写在 `testing` catalog，升级时必须同步改；四个包都显式声明，Vitest 才能从包根解析 provider。
- `@vitejs/plugin-react` 6.3 的 peer 要求 `vite ^8`，与当前版本一致；它的 `oxc-transform-react`、`babel-plugin-react-compiler` 等 peer 都是可选，不会被自动安装。
- 不引入 `vite-tsconfig-paths`：Vite 8 原生支持 `resolve.tsconfigPaths`，且其 `tsconfck` 依赖与 TypeScript 6 有 peer 冲突（apply 时 `pnpm peers check` 报错）。
- `jsdom` 是 Vitest 的可选 peer，必须由 React 两个包显式声明，否则 `environment: "jsdom"` 会在解析 `jsdom` 时失败。
- `@nestjs/testing` 加入 `backend` catalog（`^12.5.0`），由 backend / bff 声明。
- `packages/vitest-config` 的 `devDependencies` 只放 `vitest`（类型）、`typescript`、`@workspace/typescript-config`；运行时零依赖。

### D8. Turbo 任务与根脚本

```json
"test": {
  "description": "各工作区并行运行 Vitest 测试并产出覆盖率；行覆盖率低于 95% 即失败",
  "dependsOn": ["^test"],
  "outputs": ["coverage/**"]
},
"test:watch": {
  "description": "各工作区并行进入 watch 模式；persistent 任务，不缓存",
  "cache": false,
  "persistent": true
}
```

- `test` 的 `outputs` 覆盖每个包的 `coverage/`，命中缓存时 Turbo 会连同 HTML 报告一起恢复；`coverage/` 已在 `.gitignore` 中。
- `test:watch` 与 `dev` 同属 persistent，不能和 `test` 混在同一次 `turbo run` 里，根脚本分开暴露。
- 各包脚本：`"test": "vitest run --coverage"`、`"test:watch": "vitest --watch"`；`passWithNoTests: true` 只负责“没有测试文件”时不报错，覆盖率阈值仍会独立生效。

### D9. 覆盖到 95% 行覆盖率的最小测试集

四个包都必须真的越过 95% 行覆盖率门槛，测试不写成业务测试，但覆盖面要覆盖当前骨架的全部可测源码：

- `apps/backend/src/app.controller.spec.ts`：`Test.createTestingModule({ imports: [AppModule] })` 编译后取 `AppController`，断言 `health()` 返回 `backend`。一次覆盖 `app.module.ts` 与 `app.controller.ts`；`coverage.include: ["src/**/*.ts"]`，`exclude: [...coverageConfigDefaults.exclude, "src/main.ts"]`（bootstrap 顶层 await 会启动服务，不纳入）。
- `apps/bff/src/app.controller.spec.ts`：同上，断言 `bff`；include / exclude 相同。
- `apps/frontend/__tests__/page.test.tsx`：`render(<Page />)`（`import Page from "@/app/page"`），断言标题与按钮文本，覆盖 `page.tsx`。
- `apps/frontend/__tests__/theme-provider.test.tsx`：渲染 `ThemeProvider` + 子节点（`import { ThemeProvider } from "@/components/theme-provider"`），断言子节点可见，并触发 `d` 快捷键的各条提前返回分支，覆盖 `theme-provider.tsx`。`coverage.include: ["src/**/*.ts", "src/**/*.tsx"]`，`exclude: [...coverageConfigDefaults.exclude, "src/app/layout.tsx"]`（Next 根布局，html/body/metadata 是框架入口，RTL 里嵌套 html/body 不成立）。
- `packages/ui/__tests__/button.test.tsx`：分别渲染默认 `Button` 与 `asChild` 用法，断言 `role="button"` 与插槽语义，覆盖三元分支。
- `packages/ui/__tests__/card.test.tsx`：用 `Card` + `CardHeader` / `CardTitle` / `CardDescription` / `CardAction` / `CardContent` / `CardFooter` 组合渲染，覆盖全部导出函数。
- `packages/ui/__tests__/utils.test.ts`：`import { cn } from "@workspace/ui/lib/utils"`，断言样式合并，覆盖 `utils.ts`。`coverage.include: ["src/**/*.ts", "src/**/*.tsx"]`，无排除。

只卡 `lines` 95%；functions / branches / statements 照常出现在报告里，供论文参考，不作为失败条件。如果行覆盖率差一点，先补测试，不降阈值。

### D10. 覆盖率实现

- provider 用 `@vitest/coverage-v8`：与 Vite 8 / Oxc 的转换链一致、速度最快；论文只需要数值与报告，不追 istanbul 的逐语句精确度。若 v8 在装饰器或 JSX 文件上出现明显偏差，只改共享 profile 一处切到 `@vitest/coverage-istanbul`。
- 阈值只写 `lines: 95`。functions / branches / statements 仍由 reporter 输出，但不参与失败判定：branch 95% 对 shadcn 的 variant 组合过于脆弱，会把质量门槛变成“为覆盖率凑渲染用例”；行覆盖率是最直观、也最容易在论文里解释的口径。若后续需要更严，只改共享 profile 一处。
- `coverage.enabled` 不在共享配置里打开，`test` 脚本用 `--coverage` 显式开启；这样 `test:watch` 不会每轮收集，IDE 里直接跑单个文件也不强制覆盖率。
- `coverage.include` / `exclude` 是路径项，留在各包（见 D2 表）；框架入口 `src/main.ts`、`src/app/layout.tsx` 明确排除，其余 `src` 下的源码全部计入，防止“只统计被测试导入的文件”把门槛做虚。设置 `exclude` 时必须用 `coverageConfigDefaults.exclude` 展开默认值（node_modules、dist、测试文件），否则会覆盖掉 Vitest 的默认排除。
- 报告目录用默认 `./coverage`，`reporter: ["text", "html"]`：终端看四项汇总，HTML 给论文截图；每个包各一份，不做跨包合并。
- 门槛对新增业务代码同样生效：后续每个业务模块的测试与实现同一提交，否则 `pnpm test` 直接失败。

### D11. 明确不做

- 跨包的合并覆盖率报告与 CI 上传；每包独立 95% 行覆盖率门槛（D10）。
- `@storybook/addon-vitest` / Playwright / Browser Mode；`packages/ui` 的 MCP 工具集仍为 docs + development。
- oxlint / Prettier；测试文件先按现有 TS 严格度检查。
- Nest e2e 的 HTTP 断言（supertest）；等业务模块出现后再加 `test/` 与独立配置。

## Risks / Trade-offs

- [共享包 `.ts` 出口在 NodeNext 下可能触发 TS5097] → apply 时先跑 `pnpm check-types`；失败则按 D3 回退到 `tsc` 构建。
- [Vitest 的 Oxc 转换路径可能不注入装饰器元数据] → Nest 冒烟测试必须真的用 `Test.createTestingModule`；失败则回退 `unplugin-swc`，并在设计里保留 SWC 作为受支持备选。
- [只发 `.ts` 依赖 Node 26 类型剥离与 pnpm 符号链接] → `engines` 已锁 Node 26 且 `engineStrict: true`；在 README / 包文档写明「不要把配置包目录复制进 node_modules」这类前提。
- [Vite 版本出现两份（Storybook 与 Vitest）] → 把 `vite` 收进 `tooling` catalog 并显式声明；`pnpm install` 后检查 `node_modules/.pnpm` 只有一份 `vite@8.3.8`。
- [`next build` 会类型检查测试文件] → 测试只使用纯 React 与 Testing Library，不引用 `next/headers` 等请求期 API。
- [Next 官方提示 Vitest 不支持 async Server Components] → 冒烟测试只测同步组件；业务页面出现 `async` 组件时改用 e2e。
- [UI 的测试目录不在原 tsconfig include 内] → 同步补 `__tests__` 与 `vitest.config.ts`，否则测试文件不会被 `check-types` 覆盖。
- [Nest 构建可能把测试文件带进 dist] → 现有 `tsconfig.build.json` 已 exclude `test` 与 `**/*spec.ts`；构建后用 `dist` 文件清单确认无测试文件。
- [测试通过 `passWithNoTests` 掩盖配置错误] → 四个包都放真实用例，首次接入必须看到用例通过与覆盖率达标，而不是 0 tests。
- [95% 行覆盖率门槛会让当前骨架直接失败] → 本次同时补齐覆盖当前源码的最小测试集（D9）；后续业务代码的测试与实现同一提交，否则 `pnpm test` 会失败。
- [v8 provider 在装饰器 / JSX 文件上的统计偏差] → 先以实际报告为准；若数值明显异常，只改共享 profile 与 catalog，切到 `@vitest/coverage-istanbul`。
- [`coverage/` 进入 Turbo 缓存或误提交] → `test` 的 `outputs: ["coverage/**"]`，`.gitignore` 已忽略 `coverage/`。

## Migration Plan

1. 新建 `packages/vitest-config`（`package.json`、`src/index.ts`、`tsconfig.json`、三份包级文档）。
2. 更新 `pnpm-workspace.yaml`：新增 `testing` catalog，`vite` 移到 `tooling`；更新 `packages/ui` 的 vite 引用。
3. `pnpm install`，确认四个包拿到 `vitest`、`@vitest/coverage-v8`、`vite`、`@workspace/vitest-config` 链接，且 `.pnpm` 中只有一份 Vite。
4. 先接 Nest 两个包：配置、脚本、覆盖 `AppModule` / controller 的测试；跑 `pnpm --filter backend test` / `pnpm --filter bff test`，确认行覆盖率 ≥ 95%（其余三项看报告）。
5. 再接 React 两个包：配置、setup、覆盖 `page` / `theme-provider` / `Button` / `Card` / `utils` 的测试、ui tsconfig include；跑 `pnpm --filter frontend test` / `pnpm --filter @workspace/ui test`，确认行覆盖率 ≥ 95%（其余三项看报告）。
6. 加 Turbo 任务与根脚本，跑 `pnpm test` 两次确认第二次命中缓存（含 `coverage/` 恢复），再跑 `pnpm test:watch` 确认 persistent 行为。
7. 同步根文档、四个包 `CLAUDE.md`、`openspec/config.yaml` 的 `context`。
8. 全量验证：`pnpm install`、`pnpm check-types`、`pnpm test`、三个 build、`pnpm exec openspec validate --all`。

回滚：本次改动不触碰业务代码与构建配置；删除 `packages/vitest-config`、还原根 `package.json` / `turbo.json` / `pnpm-workspace.yaml` 与四个包的新增文件即可。

## Open Questions

- 跨包合并覆盖率报告（`--merge-reports` + blob reporter）是否需要在论文里给出一张总表，等实际写作需要时再开变更；当前是每包 95% 行覆盖率。
- functions / branches / statements 目前只报告不卡门槛；若论文需要把它们也纳入验收，评审后再把对应阈值加进共享 profile。
- `@vitejs/plugin-react` 在 Vite 8 / Oxc 下是否与内建 JSX 转换重复，apply 时用冒烟测试与 `next build` 判断；若有冲突就去掉插件，保留 `vite-tsconfig-paths`。
- `test:watch` 是否需要配合 Turbo TUI 的输入过滤，等实际使用后再调，不放进本次任务。
