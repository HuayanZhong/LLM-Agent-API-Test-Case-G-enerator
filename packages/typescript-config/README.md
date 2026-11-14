# @workspace/typescript-config

workspace 共享 TypeScript 配置包。只放 `tsconfig` profile，不产出运行代码，也不参与构建；各包通过 `extends` 继承。

## 职责

统一 `target`、`module`、`strict`、装饰器、`noEmit` 这类"行为开关"，避免四个包各写一份。与路径、产物、框架插件相关的配置仍留在各自包内。

## 运行

本包没有构建产物；只提供 `lint` / `format` 脚本，用于检查本包的 JSON 与文档。消费方在 `package.json` 的 `devDependencies` 声明：

```json
"@workspace/typescript-config": "workspace:*"
```

```bash
pnpm --filter @workspace/typescript-config lint    # oxlint .，根配置
pnpm --filter @workspace/typescript-config format  # oxfmt --check .，根配置
```

然后在本包 `tsconfig.json` 里继承：

```json
{
  "extends": "@workspace/typescript-config/nextjs.json",
  "include": ["src"]
}
```

| profile | 使用方 | 关键设置 |
|---|---|---|
| `base.json` | 被其余 profile 继承 | `ES2023`、`NodeNext`、`strict`、`noUncheckedIndexedAccess`、`noFallthroughCasesInSwitch`、`noImplicitOverride`、`incremental: false` |
| `nextjs.json` | `apps/frontend` | `ESNext` + `Bundler`、DOM lib、`react-jsx`、`allowJs`、`noEmit` |
| `react-library.json` | `packages/ui` | `ESNext` + `Bundler`、DOM lib、`react-jsx`、`noEmit` |
| `nestjs.json` | `apps/backend`、`apps/bff` | NodeNext + 装饰器、`declaration`、`sourceMap`、`incremental: true` |

## 目录

```text
packages/typescript-config/
├── base.json
├── nextjs.json
├── react-library.json
├── nestjs.json
├── README.md
├── CLAUDE.md
└── AGENTS.md
```

## 依赖与边界

- 不依赖任何 npm 包；TypeScript 版本由 `pnpm-workspace.yaml` 的 `catalog:tooling` 决定。
- 只放无路径语义的 `compilerOptions`。`include` / `exclude` / `paths` / `outDir` / `rootDir` / `types` / `plugins` 必须留在消费包：`extends` 中的路径选项按声明它的文件解析。
- 不负责 Vitest、Oxlint / Oxfmt 的配置：Vitest profile 在 `packages/vitest-config`，Oxc 配置在仓库根。

## 相关文档

- 根入口：[../../README.md](../../README.md)、[../../CLAUDE.md](../../CLAUDE.md)、[../../AGENTS.md](../../AGENTS.md)
- 文档同步规则：[../../.claude/rules/doc-sync.md](../../.claude/rules/doc-sync.md)
- 共享 UI 包：[../ui/README.md](../ui/README.md)
