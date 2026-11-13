# Design

## Context

现状见 proposal.md 的 Why。与方案直接相关的约束：

- 已安装 TypeScript 6.0.3。实测 `tsc --showConfig` 发现 6.0 的新默认值：未写 `target` 时落成 `LatestStandard`，`moduleDetection` 默认 `force`，`preserveConstEnums` 默认 `true`。共享配置必须把会影响编译语义的值写死，否则升级 TS 小版本时行为可能漂移。
- Turborepo 2.11.11 自带的文档（`node_modules/turbo/docs/guides/tools/typescript.mdx`）推荐 `packages/typescript-config` 包 + 每个包 `extends`，并明确不建议仓库根 tsconfig 与 Project References。
- `apps/backend` / `apps/bff` 的 tsconfig 是 NestJS 12 `nest new` 的原样产物；`apps/frontend` 的 tsconfig 是 Next.js 16 自动写入后的结果。两者都可作为对应 profile 的官方基线。
- pnpm 仓库根没有 `@types/node`（只有 `apps/*/node_modules` 与 `packages/ui/node_modules` 里有），因此 `types: ["node"]` 不能放进共享包。
- `apps/frontend` 的 `package.json` 有 `"type": "module"`，ESM 口径已统一。

## Goals / Non-Goals

**Goals:**

- 四个包共享同一套"行为开关"类 compilerOptions，同一事实只有一个权威位置。
- 每个包只保留与自身路径、产物、框架相关的配置。
- 提供可并行、可缓存的 `check-types` 入口，为后续测试与 oxc 接入留好位置。
- 不改变任何业务行为、端口、启动方式。

**Non-Goals:**

- 不引入 Vitest / oxlint / Prettier，不改 `pnpm-workspace.yaml` 的 catalog 分类。
- 不改 TypeScript 版本，不改 Node 版本要求。
- 不做 TypeScript Project References（Turborepo 文档明确不建议）。
- 不改 `packages/ui` 只发源码、由 Next 转译的构建策略。
- 不新增 `skipLibCheck: false` 之类的质量实验。

## Decisions

### D1. 用私有包承载配置，不用仓库根 tsconfig

选择 `packages/typescript-config`（包名 `@workspace/typescript-config`），与 `@workspace/ui` 命名一致。

- 备选：仓库根 `tsconfig.base.json`。否决：Turbo 文档指出根目录任何改动会让所有任务缓存失效，且根配置不属于任何包，任务图无法表达依赖。
- 备选：直接依赖官方 `@tsconfig/*`（如 `@tsconfig/node26`、`@tsconfig/next`）。否决：这些预设是固定组合，无法同时表达 Nest 装饰器、`noEmit` 的 UI 包和 `ESNext/Bundler` 的 Next 差异；多一层外部依赖反而增加版本对齐成本。本方案直接以已安装版本的官方产物为基线，自建四个 profile。

### D2. 四个 profile 的分工

```
                    base.json
                        |
        +---------------+---------------+
        v               v               v
   nextjs.json   react-library.json  nestjs.json
        |               |               |
  apps/frontend   packages/ui   apps/backend + apps/bff
```

- `base.json`：`target: ES2023`、`lib: ["ES2023"]`、`module/moduleResolution: NodeNext`、`moduleDetection: force`、`strict`、`noUncheckedIndexedAccess`、`skipLibCheck`、`esModuleInterop`、`isolatedModules`、`resolveJsonModule`、`incremental: false`。
- `nextjs.json`：`module: ESNext`、`moduleResolution: Bundler`、`lib: ["DOM", "DOM.Iterable", "ESNext"]`、`jsx: react-jsx`、`allowJs`、`noEmit`。
- `react-library.json`：与 nextjs 相同的 bundler / DOM / jsx / noEmit，但没有 `allowJs`。
- `nestjs.json`：`resolvePackageJsonExports`、`declaration`、`removeComments`、`emitDecoratorMetadata`、`experimentalDecorators`、`sourceMap`、`incremental: true`、`strictPropertyInitialization: false`。

Nest 两个包的 `incremental: true` 会把 `*.tsbuildinfo` 写在 app 根目录，污染源目录。因此各 app 的 `tsconfig.json` 与 `tsconfig.build.json` 用本地 `tsBuildInfoFile` 把缓存指到 `node_modules/.cache/`（路径项不能放共享包）：`tsconfig.json` 用 `tsconfig.tsbuildinfo`，`tsconfig.build.json` 用 `tsconfig.build.tsbuildinfo`，两者互不覆盖。

`lib`、`types` 这类数组选项在 `extends` 中是整组替换而非合并，所以 Next / React profile 必须写全自己需要的 lib。

### D3. 按路径语义划分：什么进共享包

TypeScript 的 `extends` 中，带路径语义的选项按"声明它的那个文件"解析。这一条决定了提取边界：

| 配置项 | 位置 | 原因 |
|---|---|---|
| `target` / `lib` / `strict` / `module` / `moduleResolution` / `jsx` / `noEmit` / 装饰器 / `declaration` / `sourceMap` / `incremental` | 共享包 | 纯行为开关，无路径语义 |
| `include` / `exclude` | 各包 | 相对声明文件解析 |
| `paths` | 各包 | 同上；frontend 的 `@/*`、ui 的自引用互不相同 |
| `outDir` / `rootDir` | 各 Nest 包 | 同上；`./dist` 必须相对 app 解析 |
| `types: ["node"]` | 各 Nest 包 | `@types` 从声明文件位置向上查找；仓库根没有 `@types/node`，放共享包会报 TS2688 |
| `plugins: [{ name: "next" }]` | `apps/frontend` | 插件按模块名从项目位置解析 |
| `next-env.d.ts`、`.next/**/*.ts` | `apps/frontend` | Next 自己管理 |

`apps/backend/tsconfig.build.json` 与 `apps/bff/tsconfig.build.json` 保持原样：只加 `rootDir: ./src`、`include: ["src"]`、`exclude`，继续 `extends ./tsconfig.json`。

### D4. Next 16：app 保留 Next 自己管理的字段

`next/dist/lib/typescript/writeConfigurationDefaults.js` 第 238 行：只要 app 的 tsconfig（未解析 extends 的原文）含有 `extends` 或 `references`，Next 就直接 `return`，不再自动补 `include`、`plugins`。

因此：

- `apps/frontend/tsconfig.json` 必须自己保留 `plugins`、`next-env.d.ts` 与 `.next/**/*.ts` 的 include，不能依赖 Next 自动写入。
- 反过来，`next dev` 不会再去改我们的 tsconfig，配置不会再被 Next 悄悄重写。
- `module` / `moduleResolution` / `jsx` 放在 `nextjs.json` 是安全的：类型检查走 `parseJsonConfigFileContent`（会解析 extends），而 `runTypeCheck.js` 还会用自己的 required 值覆盖这三项。
- `preserveConstEnums` 是 TS 6 默认值，不单独声明。

### D5. `check-types` 与 Turbo

- 每个包新增 `"check-types": "tsc --noEmit"`；`packages/typescript-config` 只是 JSON，不参与。
- 根 `package.json` 新增 `"check-types": "turbo run check-types"`。
- `turbo.json` 新增：

```json
"check-types": {
  "description": "各工作区并行做类型检查",
  "dependsOn": ["^check-types"]
}
```

`dependsOn: ["^check-types"]` 让依赖包的检查先跑（例如 `packages/ui` 先于 `apps/frontend`）。不引入 Turbo 文档里的 `topo` 传递节点，因为当前只有一层包依赖，回归问题出现时再加。

已验证 Nest 的 `declaration: true` 与 `--noEmit` 可以共存（`tsc --noEmit -p apps/backend/tsconfig.json` 退出码 0），所以 check-types 不需要额外的 `emitDeclarationOnly` 处理。

## Risks / Trade-offs

- [Next 不再自动维护 tsconfig] → 把 Next 需要的 include 与 `plugins` 写死在 app 里，并在 apply 后用 `next dev` + `git diff` 验证配置未被改写；`next-env.d.ts` 的 `.next/types` ↔ `.next/dev/types` 翻转是已知现象，单独确认。
- [`noUncheckedIndexedAccess` 进入 Nest 两个包，严格度提高] → 当前 Nest 骨架只有三个文件，先统一；若后续 MikroORM / LangGraph 代码噪音过大，只在 `nestjs.json` 一处关闭，不在各包各写一份。
- [TS 6 小版本默认值漂移] → `target`、`module`、`moduleResolution`、`moduleDetection` 全部显式声明，不依赖默认值。
- [`packages/ui` 的 `paths` 自映射可能是冗余] → 保留不动，减少本次改动的面；是否删除留到后续单独验证。
- [配置包没有构建产物，`tsc` 不会检查 JSON 拼写] → 每个 profile 在 apply 阶段都用 `tsc --showConfig` 验证一遍，四个包的继承值必须与预期一致。

## Migration Plan

1. 新增 `packages/typescript-config` 的 `package.json`、四个 profile 与三份包级文档。
2. `pnpm install`，确认四个包都有 `@workspace/typescript-config` 的链接。
3. 按 backend → bff → ui → frontend 的顺序切换 `extends`，每切一个就跑 `tsc --showConfig` 与对应的 build / check-types。
4. 加 `check-types` 脚本与 Turbo 任务，跑根 `pnpm check-types`。
5. 同步根文档与 `openspec/config.yaml` 的 `context`。

回滚：四个 tsconfig 与两个 `package.json` 的改动是一个原子提交，直接 revert 即可；配置包删除后不影响任何业务代码。

## Open Questions

- `packages/ui/tsconfig.json` 里的 `@workspace/ui/*` 自映射是否已被包 `exports` 完全覆盖，可以在 apply 时用 `tsc` 试删验证；不影响本方案。
