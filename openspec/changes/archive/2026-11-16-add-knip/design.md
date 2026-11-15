# Design

## Context

见 `proposal.md`。仓库是 pnpm workspace + Turbo：9 个包、`nodeLinker: hoisted`、Oxc 做 lint / format、Vitest 卡 95% 行覆盖率。现有 CI 的 `quality` job 只有 lint / format / format:root / check-types，没有任何依赖图或死代码检查。`knip@6.45.1` 的 Node 引擎要求与本仓库兼容，发布于 2026-11-11，已满足 `minimumReleaseAge`。

## Goals / Non-Goals

**Goals:**

- 用一个命令发现未使用依赖、未声明依赖、死文件与无消费方的导出。
- 把检查固化为 CI 门禁，且首轮 findings 清零。
- 配置只保留必要豁免，避免变成新的噪音源。

**Non-Goals:**

- 不用 `knip --fix` / `sherif --fix` 自动改代码或依赖；修复一律人工确认。
- 不引入 `depcheck`、`ts-prune`、`publint` 等重叠工具；sherif 与 knip 互补，一起接入。
- 不改任何应用的运行时行为、任务链或包边界。
- 不扫描 `openspec/`、`doc/`、`.claude/`、`.agents/` 与构建产物。

## Decisions

### 1. knip 管死代码，sherif 管依赖一致性

knip 一份配置覆盖四类问题（文件、依赖、导出、类型），且原生理解 pnpm workspace；`depcheck` 只看单包依赖，`ts-prune` 只看导出且维护弱，`publint` 管发布形态，都不解决「死依赖 + 死引用」。`nodeLinker: hoisted` 下的幽灵依赖属于 knip 的 unlisted dependencies，正好命中本仓库的真实风险。

sherif 解决的是另一类问题：同一依赖在不同 workspace 出现多个版本、依赖放错 `dependencies` / `devDependencies`、workspace 协议写法不一致、包字段顺序漂移。它零配置、无依赖图分析，和 knip 不重叠，因此两个都接入，而不是二选一。

### 2. 配置放根 `knip.jsonc`，用本地 schema

`$schema` 指向 `./node_modules/knip/schema.json`，符合仓库「优先使用依赖自带的本地 schema」的约定。`knip.jsonc` 加入 `format:root` 的文件清单，避免根配置漏检。

配置按 workspace 声明入口与工程文件：

| workspace | 入口 / 工程文件 |
|---|---|
| `apps/frontend` | Next App Router 自动识别；`next.config.ts`、`vitest.config.ts`、`__tests__/**` |
| `apps/desktop` | `src/main.ts`、`src/preload.ts`、`forge.config.ts`、`vite.*.config.mts`、`vitest.config.ts`、`__tests__/**`、`scripts/copy-renderer.mjs` |
| `apps/backend` / `apps/bff` | `src/main.ts`、`src/**/*.spec.ts`、`vitest.config.ts` |
| `packages/ui` | `.storybook/**`、`stories/**`、`src/**`（exports）、`__tests__/**` |
| `packages/types` / `packages/config` | `package.json` 的 `exports` 即入口；测试目录作为工程文件 |
| `packages/typescript-config` | 只有 JSON，无可分析源码 |
| `packages/vitest-config` | `src/index.ts` |

忽略：`openspec/**`、`doc/**`、`.claude/**`、`.agents/**`、`**/coverage/**`、`**/.next/**`、`**/out/**`、`**/dist/**`、`**/.vite/**`、`**/renderer/**`、`apps/frontend/next-env.d.ts`。

### 3. CLI-only 依赖做显式豁免

`@fission-ai/openspec` 与 `shadcn` 只在文档里通过 `pnpm exec` / `pnpm dlx` 使用，没有源码 import。把它们放进 `ignoreDependencies`，并写注释说明原因；不要为了消警告去加无意义的脚本。首轮还可能暴露 CSS-only 依赖（如 `tw-animate-css`），按同样原则确认后豁免或移除。

### 4. 入口导出视为公开 API

`packages/types` 与 `packages/config` 的 `package.json` `exports` 指向的文件本身就是入口；knip 默认不把入口导出当死代码。`packages/config` 里暂未被 app 消费的四个工厂属于公开 API，不能因为「当前没人用」就删掉；若首轮仍被报告，用配置保留并写注释。

### 5. 门禁只跑检查，`--fix` 留在本地

`quality.yml` 在 `pnpm check-types` 之后加 `pnpm sherif` 与 `pnpm knip`，与现有步骤共用一次安装；两者都是静态分析，不需要 build。`knip:fix` / `sherif --fix` 只作为本地人工工具，不进入 CI，也不在变更里自动执行——它们会直接删 `package.json` 依赖和源码导出，共享包误删后要到消费方才炸。

### 6. 首轮 findings 逐条处理

- 真实未使用依赖：从对应 `package.json` 删除，并跑该包 `check-types` / `test`。
- 真实死文件 / 死导出：确认没有跨 workspace 消费方后删除。
- 幽灵依赖：优先补声明；如果只是误用，改回已声明的包。
- 误报：写进 `knip.jsonc` 的 `entry` / `ignore` / `ignoreDependencies`，并在配置里注明原因。

### 7. sherif 零配置起步

`pnpm dlx sherif@1.13.0 .` 在当前仓库实测输出 `✓ No issues found`，耗时约 100ms，因此不建配置文件、不加豁免。后续如果出现有意保留的版本分歧（例如不同 workspace 需要不同的 `@types/node`），用脚本参数 `--ignore-dependency` / `--ignore-package` 逐条豁免，并在根文档写原因；不要为了让它通过而强行统一版本。

sherif 的 `--fail-on-warnings` 暂不启用：默认错误已经返回非零；等出现 warning 噪声再评估。`sherif --fix` 只作为本地工具，不进 CI。

- [Electron / Storybook / Vitest 入口识别不全] → 首轮配置就显式列出入口，CI 失败信息会指出具体 workspace。
- [knip 版本升级改变报告规则] → `knip` 走 catalog，升级时先本地跑 `pnpm knip` 再合并；配置里的豁免逐条可追溯。
- [误删公开 API] → 不自动 `--fix`；`packages/types` / `packages/config` 的入口导出默认保留。
- [`ignoreDependencies` 越堆越多] → 每条豁免必须在配置里写一行原因；新增豁免要在 PR 里说明为什么不是死依赖。
- [CI 时间增加] → 两者都是静态分析，knip 与 sherif 合计预计秒级；与现有步骤共用安装，不新增 job。
- [sherif 对有意保留的版本分歧报警] → 用 `--ignore-dependency` / `--ignore-package` 逐条豁免，并在根文档记录原因；不要强行统一版本。
- [hoisted 幽灵依赖被误判为合法] → knip 只报未声明 import，不能替代 `pnpm install --frozen-lockfile`；两者都保留。

## Migration Plan

单次提交，无运行时迁移。顺序：catalog 加 `knip` 与 `sherif` → 根脚本与 `knip.jsonc` → `pnpm install` → 本地跑 `pnpm sherif` 与 `pnpm knip` 并逐条处理 findings → CI 与 `format:root` → 文档同步。验证：`pnpm sherif` 与 `pnpm knip` 退出码 0，`pnpm check-types` / `lint` / `format` / `test` / `build` 仍全部通过。回滚直接 revert 本次提交。

## Open Questions

无。是否把死导出降级为告警已由「骨架优先、全部先准备好」的决定排除，首轮即按完整门禁执行。
