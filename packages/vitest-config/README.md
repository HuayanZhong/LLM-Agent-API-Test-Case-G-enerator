# @workspace/vitest-config

workspace 共享 Vitest 配置包。只发源码、不做 build；各包在 `vitest.config.ts` 里展开对应的 profile。

## 职责

统一 `environment`、mock 清理、覆盖率 provider 与阈值这类"行为开关"，避免四个包各写一份。与路径、setup 文件、覆盖率统计范围相关的配置仍留在各自包内。

## 运行

本包没有 dev/build 脚本；提供 `check-types`、`lint` 与 `format`。消费方在 `devDependencies` 声明：

```bash
pnpm --filter @workspace/vitest-config check-types
pnpm --filter @workspace/vitest-config lint    # oxlint .，根配置
pnpm --filter @workspace/vitest-config format  # oxfmt --check .，根配置
```

```json
"@workspace/vitest-config": "workspace:*"
```

然后在包根的 `vitest.config.ts` 里展开 profile：

```ts
import { defineConfig } from "vitest/config"
import { base } from "@workspace/vitest-config"

export default defineConfig({
  ...base,
  test: { ...base.test, include: ["src/**/*.spec.ts"] },
})
```

| profile | 使用方 | 关键设置 |
|---|---|---|
| `base` | `apps/backend`、`apps/bff` | `environment: "node"`、`clearMocks`、`passWithNoTests`、覆盖率 `v8` + `text`/`lcov`/`json-summary`、`thresholds.lines: 95` |
| `react` | `apps/frontend`、`packages/ui` | 在 `base` 上只把 `environment` 改成 `"jsdom"` |

`coverage.enabled` 保持 `false`，由各包 `test` 脚本的 `--coverage` 打开。需要可视化报告时用 `--coverage.reporter=html`。

## 目录

```text
packages/vitest-config/
├── src/index.ts    base 与 react 两个命名导出
├── package.json
├── tsconfig.json
├── README.md
├── CLAUDE.md
└── AGENTS.md
```

## 依赖与边界

- `vitest` 只用于类型（`import type { ViteUserConfig }`）；运行时零依赖。
- 只放无路径语义的 `test` 选项。`include` / `setupFiles` / `coverage.include` / `coverage.exclude` 必须留在消费包：Vitest 按包根解析这些路径，放进本包会指错位置。
- 本包以 `.ts` 源码直接给 Node 加载，依赖 Node 26 的类型剥离与 pnpm 的 workspace 符号链接（`engines` 已锁 `>=26.12.1`）；不要把本包目录复制进 `node_modules`。
- Oxlint / Oxfmt 配置在仓库根，本包只提供 `lint` / `format` 脚本；不负责 Storybook `addon-vitest` 与 Playwright。

## 相关文档

- 根入口：[../../README.md](../../README.md)、[../../CLAUDE.md](../../CLAUDE.md)、[../../AGENTS.md](../../AGENTS.md)
- 文档同步规则：[../../.claude/rules/doc-sync.md](../../.claude/rules/doc-sync.md)
- 共享 tsconfig 包：[../typescript-config/README.md](../typescript-config/README.md)
