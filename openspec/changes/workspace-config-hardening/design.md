# Design

## Context

审查基于实际执行验证，见 [proposal.md](proposal.md) 与审查结论。关键实测：

- `pnpm turbo run build --dry=json` → `Could not find task 'build' in project`。
- `pnpm --filter @workspace/ui exec vitest list --filesOnly` → 只列出 `button.test.tsx`、`card.test.tsx`，`utils.test.ts` 缺失。
- 把 `.editorconfig` 的 `indent_size` 改为 4 后，`pnpm turbo run format` 仍 6/6 cache hit。
- 修改 `packages/typescript-config/base.json` 与 `packages/vitest-config/src/index.ts` 后，对应任务均 cache miss，说明包依赖已被 Turbo 正确追踪，不需要额外 `globalDependencies`。

## Goals / Non-Goals

**Goals:**

- 让 `turbo run build` 可用，并让构建产物进入缓存。
- 让所有 `.test.ts` / `.test.tsx` 都被 Vitest 发现。
- 让影响格式化结果的隐藏配置进入缓存键。
- 让根级配置文件也被格式化检查覆盖。
- 消除 MCP 常驻连接失败与文档偏差。

**Non-Goals:**

- 不新增 GitHub Actions、Renovate、agent review（下一变更）。
- 不改 Nest 构建工具链，不替换 tsc。
- 不调整 TypeScript strictness，不合并覆盖率报告。
- 不引入 lint-staged / husky。

## Decisions

### D1. `build` 任务放在 Turbo，而不是只在各 app

`apps/frontend`、`apps/backend`、`apps/bff` 已有 `build` 脚本；缺的是 Turbo 侧任务定义。

```json
"build": {
  "description": "各工作区并行构建；产物进 Turbo 缓存",
  "dependsOn": ["^build"],
  "outputs": [".next/**", "!.next/cache/**", "dist/**", "storybook-static/**"]
}
```

- `outputs` 覆盖 Next 的 `.next`、Nest 的 `dist`、Storybook 的 `storybook-static`；`.next/cache` 是 Next 自己的构建缓存，进 Turbo 缓存会膨胀且无收益。
- `@workspace/typescript-config`、`@workspace/vitest-config` 没有 `build` 脚本；Turbo 只会为声明了该任务的包运行，不会报错。
- `packages/ui` 没有 `build`（只发源码），但保留 `outputs` 里的 `storybook-static/**` 给将来加 `build` 脚本留位；当前不会产生该任务。
- 根 `package.json` 增加 `"build": "turbo run build"`。

替代方案：只在 CI 里逐个 `pnpm --filter <app> build`。放弃，因为无法复用 Turbo 缓存，也无法表达依赖顺序。

### D2. Vitest include 统一为 `.test.{ts,tsx}`

两个 React 包当前是：

```ts
include: ["__tests__/**/*.test.tsx"]
```

改为：

```ts
include: ["__tests__/**/*.test.{ts,tsx}"]
```

- `.test.ts` 用于纯逻辑测试（`cn` 合并、工具函数），`.test.tsx` 用于组件渲染；两者都应进入同一套覆盖率。
- Nest 包继续用 `src/**/*.spec.ts`，不受影响。
- 改完后 `packages/ui` 的测试文件从 2 个变 3 个，测试数从 4 变 5；覆盖率 `coverage.include` 已经覆盖 `src`，不需要改。
- `apps/frontend` 当前只有 `.tsx` 测试，改动是防御性的，不改测试数量。

替代方案：把 `utils.test.ts` 改名成 `.test.tsx`。放弃，因为测试对象是纯函数，用 `.ts` 更准确，也更符合“扩展名表达测试类型”的约定。

### D3. `globalDependencies` 增加 `.editorconfig` 与 `.nvmrc`

Oxfmt 官方文档明确读取 `.editorconfig` 的 `end_of_line`、`indent_style`、`indent_size`、`max_line_length`、`insert_final_newline`。当前 `globalDependencies` 只有两个 Oxc 配置，改 `.editorconfig` 不会失效 `format` 缓存。

```json
"globalDependencies": [".oxlintrc.json", ".oxfmtrc.json", ".editorconfig", ".nvmrc"]
```

- `.nvmrc` 影响 Node 版本，Node 版本影响格式化与测试行为；纳入是低成本保险。
- 不把 `package.json`、`pnpm-lock.yaml` 纳入：两者已是 Turbo 默认哈希输入，重复声明没有意义。
- 不把 `packages/typescript-config`、`packages/vitest-config` 的源码纳入：实测修改后已 cache miss，Turbo 通过 workspace 依赖自动追踪。

### D4. 根级格式化用独立根任务

六个包的 `format` 覆盖不到根 `package.json`、`pnpm-workspace.yaml`、`turbo.json`、`.oxlintrc.json`、`.oxfmtrc.json`、`.editorconfig`、`README.md` 等。两种选择：

1. 根 `format` 脚本改成 `turbo run format && oxfmt --check .`。
2. 新增独立根任务 `//#format:root`，根脚本 `format:root`。

采用方案 2：

```json
"format:root": "turbo run format:root",
"format:root:fix": "turbo run format:root:fix"
```

```json
"//#format:root": {
  "description": "根任务：格式化仓库根配置文件",
  "dependsOn": []
},
"//#format:root:fix": {
  "description": "根任务：写入根配置文件格式",
  "cache": false
}
```

并在根 `package.json` 增加：

```json
"format:root": "oxfmt --check package.json pnpm-workspace.yaml turbo.json .oxlintrc.json .oxfmtrc.json .editorconfig",
"format:root:fix": "oxfmt package.json pnpm-workspace.yaml turbo.json .oxlintrc.json .oxfmtrc.json .editorconfig"
```

- 显式列文件，避免 `oxfmt --check .` 与六个包任务重复扫描。
- `oxfmt` 默认会跳过 lock 文件与 `node_modules`，但仍显式排除 `pnpm-lock.yaml` 以防未来行为变化。
- `//#` 前缀是 Turbo 根任务语法，与包级 `format` 不冲突；`format:root` 与 `format` 分开，CI 可以只跑需要的那个。

注意：当前 `pnpm format` 的语义保持不变（只跑六个包）；文档需要写清 `format:root` 是补充。替代方案 1 会让根命令同时做两件事，`format:fix` 与 `format` 的对称性变差。

### D5. `.gitignore` 增加 `.worktrees/`

当前只写进 `.git/info/exclude`，是本地状态。加入 tracked `.gitignore`：

```gitignore
# Local git worktrees
.worktrees/
```

放在“Turborepo”段之后、`# Claude Code local settings` 之前。不影响已有 `.worktrees` 目录，也不需要删除。

### D6. `.mcp.json` 移除常驻 Storybook HTTP 端点

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "pnpm",
      "args": ["dlx", "chrome-devtools-mcp@1.13.0"]
    }
  }
}
```

- Storybook 的 `http://127.0.0.1:6006/mcp` 只在 `storybook dev` 运行时可用；常驻配置让每次会话都尝试连接并报 `ECONNREFUSED`。
- 改为文档说明：需要时在本地 `.claude/settings.local.json` 或临时 MCP 配置里加回。
- 同步修正 `README.md` 两处与 `CLAUDE.md` 一处“只含 chrome-devtools”的说法（当前实际含 Storybook，文档是错的）。

替代方案：保留但加 `"disabled": true`。`.mcp.json` 没有标准禁用字段，各客户端行为不一致，容易再次漂移；直接移除更干净。

### D7. 覆盖率 reporter 增加 `lcov` 与 `json-summary`

`packages/vitest-config/src/index.ts`：

```ts
reporter: ["text", "lcov", "json-summary"],
```

- 保留 `text` 作为终端输出；`lcov` 给 CI 上传与覆盖率服务；`json-summary` 给将来的门禁脚本或 PR 注释。
- `html` 改为可选：本地需要时用 `--coverage.reporter=html` 覆盖。这样默认产物更小，`coverage/` 也不会多出大量 HTML。
- 这是共享 profile 的变更，四个包同时生效；`coverage/**` 已是 Turbo `test` 的输出，新增文件自动进缓存。

**BREAKING**：去掉默认 `html` 会改变本地 `coverage/` 内容；文档需要写清如何按需生成 HTML。

### D8. 修正 `minimumReleaseAgeExclude` 注释

当前注释写“安装 turbo 时自动加入的平台二进制放行项”，但列表里还有 `@fission-ai/openspec`、Nest 三件套、`jsdom`。改为：

```yaml
# pnpm 供应链策略：minimumReleaseAge 的例外清单。
# Turbo 平台二进制与 OpenSpec 由安装时自动写入；Nest 与 jsdom 为手动放行，升级时复核。
```

同时评估显式设置 `minimumReleaseAge`：

```yaml
minimumReleaseAge: 1440
```

- 官方 pnpm 默认值是 1440 分钟（1 天）；显式写出来，避免不同 pnpm 版本默认值漂移。
- 当前 `pnpm config get minimumReleaseAge` 返回 `undefined`，说明依赖默认值；显式写入后，`minimumReleaseAgeExclude` 才有明确参照。
- 这一项会影响安装速度与新版本获取，属于策略变更；本次只显式化默认值，不收紧。

替代方案：不动。放弃，因为注释与实际不符就是文档 bug，且默认值漂移会让未来升级行为不可预测。

### D9. 文档与目录树

- `README.md` 目录树补 `.nvmrc`、`.editorconfig`、`.gitattributes`、`skills-lock.json`；`.mcp.json` 描述改为“chrome-devtools MCP（固定版本），Storybook 端点按需启用”。
- `README.md` 命令块补 `pnpm build`、`pnpm format:root`、`pnpm format:root:fix`；Turbo 任务注释补 `build`。
- `CLAUDE.md` 常用命令、Turbo 任务说明、仓库结构同步；`AGENTS.md` 增加 build / format:root 入口。
- `packages/vitest-config/README.md` 与 `CLAUDE.md` 补 reporter 变更；`packages/ui/CLAUDE.md` 补 `.test.ts` 约定。
- `openspec/config.yaml` 的 `context` 同步 build 任务与 reporter。

### D10. 各包 `package.json` 元数据归一化

审查发现六个 workspace 包的元数据不完整、版本不一致：

| 包 | 版本 | 缺失字段 |
|---|---|---|
| `apps/frontend` | `0.0.1` | `description`、`license`、`engines` |
| `apps/backend` | `0.0.1` | `description`、`license`、`engines` |
| `apps/bff` | `0.0.1` | `description`、`license`、`engines` |
| `packages/ui` | `0.0.0` | `description`、`license`、`engines` |
| `packages/typescript-config` | `0.0.0` | `type`、`engines` |
| `packages/vitest-config` | `0.0.0` | `engines` |

统一为：

- `version: 0.0.0`（全部 `private: true`，不发布，版本号只占位）。
- `description`：各包一行中文或英文说明；`packages/*` 沿用英文，与既有描述一致。
- `license: MIT`，与根 `LICENSE` 一致。
- `engines.node: ">=26.12.1"`，与根一致；`pnpm` 版本由根 `devEngines` / `packageManager` 统一约束，包内不重复。
- `type: "module"` 保持现状（`packages/typescript-config` 是纯 JSON 包，不需要）。
- 键顺序由 Oxfmt 的 `sortPackageJson` 决定；本次维持 `sortPackageJson: false`，用脚本写入固定顺序（`name`、`version`、`private`、`type`、`description`、`license`、`engines`、其余）。

依赖版本本身已经是统一的：所有第三方依赖走 `catalog:`，workspace 依赖走 `workspace:*`，42 个被引用包没有一处字面版本。审查确认无版本混用，因此本次只归一化元数据，不改 catalog 策略。

替代方案：给每个包加 `repository.directory`、`author`。放弃，因为全部 `private` 不发布，这些字段只在 npm 页面有意义，属于冗余。



- [新增 `build` 任务让 `turbo run build` 首次变慢] → 属于预期；后续靠缓存。CI 需要 `pnpm build` 时先确认三个 app 都能在无 `dev` 进程时构建。
- [`format:root` 与 `format` 分开，容易忘记跑] → 在 README / CLAUDE 写清；CI 的 quality job 两个都跑。
- [去掉 `html` reporter 后本地看不到可视化报告] → 文档给出 `pnpm test -- --coverage.reporter=html` 或单包 `--coverage.reporter=html` 的用法。
- [移除 Storybook MCP 端点后 AI 失去 Storybook 工具] → 文档写清按需启用方式；这也是当前会话 `ECONNREFUSED` 的根因。
- [`minimumReleaseAge` 显式化可能让新包安装延迟] → 保持官方默认 1440 分钟，不收紧；例外清单继续维护。
- [UI 测试数从 4 变 5，覆盖率数字变化] → 重新跑 `pnpm --filter @workspace/ui test` 确认仍 ≥ 95%。

## Migration Plan

1. 改 `turbo.json`（`build`、`globalDependencies`、`format:root`），根 `package.json`（`build`、`format:root`）。
2. 改两个 React 包的 Vitest `include`，跑 UI 测试确认 5 个用例。
3. 改 `packages/vitest-config` 的 reporter，跑四个包测试确认覆盖率仍过门槛。
4. 改 `.gitignore`、`.mcp.json`、`pnpm-workspace.yaml` 注释与策略。
5. 跑 `pnpm build`、`pnpm lint`、`pnpm format`、`pnpm format:root`、`pnpm check-types`、`pnpm test`。
6. 同步文档，跑 `pnpm exec openspec validate --all`。

回滚：本次只改配置与命令；revert 对应提交即可，`.worktrees` 与 MCP 端点不影响代码运行。

## Open Questions

- 是否在 CI 里跑 `pnpm build`，还是只跑 `check-types` + `test`（构建成本 vs 早期发现构建错误）。
- 是否把 Storybook `build-storybook` 纳入 Turbo `build` 任务，还是保持手动。
- 是否把 `pnpm audit` / `zizmor` 纳入本次或下一变更（当前提案留给 CI 变更）。
