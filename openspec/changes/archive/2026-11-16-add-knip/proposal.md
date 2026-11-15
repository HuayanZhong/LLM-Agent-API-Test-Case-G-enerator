# Proposal

## Why

骨架阶段已经把共享类型、env 校验和九个 workspace 包的边界立起来，但这些约束目前只靠文档与人工 review：某个 app 声明了 `@workspace/types` 却从未引用、某个依赖只剩残留、某个包导出了没人消费的接口，现有 lint / format / test / build 都发现不了。`nodeLinker: hoisted` 还让「未声明却能 import」的幽灵依赖在本地与 CI 都能跑通。跨 workspace 的依赖版本、依赖类型（dependencies / devDependencies）与 workspace 协议一致性也没有自动检查。业务代码进来之前把这两类检查固化成门禁，成本最低。

## What Changes

- 根 `devDependencies` 增加 `knip`（`catalog:tooling`，`^6.45.1`）与 `sherif`（`catalog:tooling`，`^1.13.0`），提供 `pnpm knip`（死依赖 / 死引用检查）、`pnpm knip:fix`（人工确认后使用）与 `pnpm sherif`（依赖一致性检查）。
- 新增根 `knip.jsonc`：声明各 workspace 的入口与工程文件，忽略 `openspec/`、`doc/`、`.claude/`、`.agents/` 与各构建产物；对只通过 `pnpm exec` / `pnpm dlx` 使用的 CLI 依赖（`@fission-ai/openspec`、`shadcn`）做显式豁免。
- sherif 保持零配置：当前仓库实测 `0 issues`，先用默认规则；出现需要保留的版本分歧时，用 CLI 的 `--ignore-dependency` / `--ignore-package` 逐条豁免。
- `.github/workflows/quality.yml` 增加 `pnpm sherif` 与 `pnpm knip`，与 lint / format / check-types 共用一次安装。
- 把 `knip.jsonc` 纳入 `pnpm format:root` / `format:root:fix` 的文件清单。
- 清理首轮 knip 检查发现的真实死依赖、死文件与死导出；确认属于公开 API 的导出通过配置保留，不直接删除。
- 同步 README / CLAUDE / AGENTS 的命令与包清单，以及 `openspec/config.yaml` 的 `context`。
- 不改变任何应用的运行时行为、端口、构建产物与现有任务链。

## Capabilities

### New Capabilities

无。这是工具链与工程卫生改动，没有可观察的系统行为变化，变更以 `skip_specs: true` 声明。

### Modified Capabilities

无。

## Impact

- 根 `package.json`：`knip` / `knip:fix` / `sherif` 脚本、`knip` 与 `sherif` devDependencies、`format:root` 文件清单。
- `pnpm-workspace.yaml`：`tooling` catalog 增加 `knip` 与 `sherif`；`pnpm-lock.yaml` 更新。
- 新增 `knip.jsonc`；sherif 无配置文件。
- `.github/workflows/quality.yml`：新增两步检查。
- 可能修改若干 workspace 的 `package.json`（删除真实未使用依赖）或源码导出（删除无消费方的死导出）。
- 文档：根 `README.md` / `CLAUDE.md` / `AGENTS.md`、`openspec/config.yaml` 的 `context`。
- 风险：knip 对 Electron 入口、Storybook、Vitest 与 CLI-only 依赖存在误报，需要一次性把配置调准；sherif 未来可能对有意保留的版本分歧报警，需要逐条豁免；`knip --fix` / `sherif --fix` 会直接改文件和依赖，只允许人工确认后使用。
