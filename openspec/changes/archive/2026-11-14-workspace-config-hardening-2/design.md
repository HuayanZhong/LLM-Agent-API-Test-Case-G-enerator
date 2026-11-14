# Design

## Context

本设计基于实际执行与已安装依赖的文档，不依赖推测。关键事实：

- 运行时是 Node `26.12.1`；`node --help` 确认支持 `--env-file-if-exists=...`，文件不存在时只打印提示并以 0 退出。
- `turbo` 的 `package.json` 声明 `bin.turbo = ./bin/turbo`，该文件是 Node 脚本，可被 `node` 直接执行。
- Turbo 2.11.11 自带文档说明：`envMode` 默认 `strict`；`globalDependencies` 中任一文件变化会失效所有任务；`.env` 默认不加载、也不参与 hash，除非放进 `globalDependencies` 或任务 `inputs`；任务 `inputs` 支持 `$TURBO_ROOT$`。
- `turbo run dev --dry=json` 显示六个 dev 任务均为 `envMode: "strict"`，`env` 为空。
- `turbo run format:root --dry=json` 的 `inputs` 包含 `.agents/skills/**` 等整个仓库文件，而命令实际只检查 5 个根文件。
- `git ls-files -s .claude/skills` 显示 6 个 `120000` 链接与 32 个 `100644` 普通文件混用；磁盘上全部是指向 `.agents/skills` 的目录链接，内容与 `.agents` 一致。
- `.gitignore` 当前整体忽略 `.vscode/`，仓库中不存在 `.vscode`。
- Oxfmt 0.78 的 schema 明确支持 JSON、JSONC、YAML 等语言。
- `pnpm why cn` 同时存在 `cn@0.2.6`（经 `shadcn` → `@shadcn/registry`）与 `cn@0.5.2`（`@workspace/ui` 直接依赖）。
- `@types/node` 26.x 的最新版本就是 26.6.6，因此 catalog 不需要升级。
- `origin` 远程本身就是 `.../LLM-Agent-API-Test-Case-G-enerator.git`，包名中的 `G-enerator` 与远程一致，改名不在本变更范围。

## Goals / Non-Goals

**Goals:**

- 保持根 `.env` 为唯一变量声明入口，并让变量真正到达 Turbo 任务进程。
- 让缓存键只包含真正影响该任务的文件，避免 lint / format 配置误伤 build / test。
- 让根目录所有可格式化的配置都进入 `format:root`。
- 消除跨平台 skill 目录模式、编辑器配置与元数据的明显不一致。

**Non-Goals:**

- 不引入新的环境变量加载依赖（dotenv / dotenv-cli / dotenvx）。
- 不做 `.github`、Renovate 与 agent review；CI 变更落地时再扩展 `format:root`。
- 不改覆盖率门槛、测试策略与框架业务配置。
- 不重命名 GitHub 仓库、workspace app 包名或根包名。
- 不处理 `doc/_evidence` 与 `skills-lock.json` 的更新工具链。

## Decisions

### D1. 用 Node 内置 `--env-file-if-exists` 包装 Turbo

根脚本改为：

```json
"dev":        "node --env-file-if-exists=.env --env-file-if-exists=.env.development node_modules/turbo/bin/turbo run dev",
"build":      "node --env-file-if-exists=.env --env-file-if-exists=.env.production node_modules/turbo/bin/turbo run build",
"test":       "node --env-file-if-exists=.env --env-file-if-exists=.env.development node_modules/turbo/bin/turbo run test",
"test:watch": "node --env-file-if-exists=.env --env-file-if-exists=.env.development node_modules/turbo/bin/turbo run test:watch"
```

理由：

- Node 26 已锁定（`engines` 与 `.nvmrc`），内置 flag 不需要新增依赖，也不增加供应链面。
- Turbo 的 bin 是 Node 脚本，`node --env-file-if-exists=.env <bin>` 会把变量注入当前进程，Turbo 子进程继承后再按 `env` / `globalEnv` 决定是否传给任务。
- 文件不存在时不失败，CI 与干净克隆仍可直接跑；只打印 `.env not found. Continuing without it.` 之类的提示。
- Node 允许重复传 `--env-file-if-exists`，后者覆盖前者；已用临时文件验证 `X=base` + `X=override` 的结果为 `override`。
- `.env` 放跨环境共享值，`.env.development` / `.env.production` 放环境差异值；三者都被 `.gitignore` 忽略，`.env.example` 只负责声明变量名与加载顺序。
- `.env*` 已在 `globalDependencies` 中，三个文件的任意变化都会失效 Turbo 缓存。
- 前端另用 Next 原生的 `apps/frontend/.env.development` / `.env.production` 放 `NEXT_PUBLIC_*` 实际值；这些文件被 gitignore，Turbo 默认 inputs 会忽略它们，所以 `globalDependencies` 额外加 `apps/frontend/.env*`，保证改前端 env 会让缓存失效。根 `.env.example` 仍只列变量名，避免同一变量在两处声明。

考虑过的替代：

- `dotenv-cli` / `@dotenvx/dotenvx`：能力相同，但多一个依赖，且缺文件时的报错/退出码需要额外处理。
- 用 `NODE_OPTIONS` 注入 `--env-file`：Node 不允许该 flag 出现在 `NODE_OPTIONS` 中，不可行。
- 只给 Nest 加 `ConfigModule`：解决不了 Next 与 Turbo 侧的变量传递，且把配置分散到应用内。

取舍：脚本硬编码了 `node_modules/turbo/bin/turbo`。Turbo 升级后需要确认 `bin` 字段未变；实施时增加一条验证任务，并在注释里写明来源。

### D2. 端口变量按应用拆分

`apps/backend` 读 `BACKEND_PORT`，`apps/bff` 读 `BFF_PORT`，默认值仍是 5000 / 4000。`.env.example` 用注释列出两个变量。

理由：`pnpm dev` 通过 Turbo 同时启动两个 Nest 进程；继续共用一个 `PORT` 时，任何一个非默认端口都会让两个进程冲突。变量名带应用前缀，才能在根 `.env` 这个单入口里表达两个端口。

替代：每个 app 自己的 `.env` 继续用 `PORT`。这与已选的“根 `.env` 单一入口”冲突，放弃。

### D3. Turbo 环境变量与缓存键

`turbo.json` 调整为：

```jsonc
{
  "globalDependencies": [".nvmrc", ".env*", "apps/frontend/.env*"],
  "tasks": {
    "dev": { "env": ["BACKEND_PORT", "BFF_PORT"], ... },
    "lint":  { "inputs": ["$TURBO_DEFAULT$", "$TURBO_ROOT$/.oxlintrc.json"], ... },
    "lint:fix": { "inputs": ["$TURBO_DEFAULT$", "$TURBO_ROOT$/.oxlintrc.json"], ... },
    "format": { "inputs": ["$TURBO_DEFAULT$", "$TURBO_ROOT$/.oxfmtrc.json", "$TURBO_ROOT$/.editorconfig"], ... },
    "format:fix": { "inputs": ["$TURBO_DEFAULT$", "$TURBO_ROOT$/.oxfmtrc.json", "$TURBO_ROOT$/.editorconfig"], ... },
    "//#format:root": { "inputs": ["package.json", "pnpm-workspace.yaml", "turbo.json", ".oxlintrc.json", ".oxfmtrc.json", ".mcp.json", "skills-lock.json"] }
  }
}
```

要点：

- `.env*` 放全局是安全的：变量值可能影响任何任务，变化时全部失效缓存是正确行为；`.env.example` 也在其中，改示例会 miss 一次，可接受。
- `.oxlintrc.json` / `.oxfmtrc.json` / `.editorconfig` 只影响 lint / format，不应放进 `globalDependencies`；用 `$TURBO_ROOT$` 指向根文件。
- `//#format:root` 是根包任务，`inputs` 直接写根相对路径；精确限定为它检查的 7 个文件，避免改文档或 skill 时 miss。
- 保持默认 `envMode: "strict"`，不改成 loose。变量声明缺失时任务失败或拿不到值，是期望的保护。

### D4. 根文件格式化清单

`format:root` / `format:root:fix` 增加 `.mcp.json`、`skills-lock.json`。两个文件当前已经符合 Oxfmt 格式，加入后不会产生额外 diff。

`.github/**/*.yml`、`renovate.json` 属于 CI 变更，落地时由该变更把它们加入同一清单；本变更只更新根 JSON。

### D5. 移除未使用的 `storybook-static/**` 输出

`turbo.json` 的 `build.outputs` 删除 `storybook-static/**`。当前 `packages/ui` 只有 `build-storybook`，没有被 `build` 任务调用，这个 output 永远不会产生，属于过期声明。

替代：给 UI 增加 `build`，内容为 `storybook build`。会让每次 `pnpm build` 多跑一次 Storybook，且与“源码包不 build”的边界冲突，放弃。Storybook 构建仍用：

```bash
pnpm --filter @workspace/ui build-storybook
```

### D6. 元数据清理

- 根 `package.json` 版本改为 `0.0.0`，与六个 workspace 包一致；根 `name` 与仓库 URL 保持不变，因为 `origin` 本身使用 `G-enerator`，改名需要先改 GitHub 仓库。
- **`shadcn` 必须保留**：实施时删除 `packages/ui` 的 `shadcn` devDependency 后，`pnpm --filter frontend build` 失败：

  ```text
  CssSyntaxError: tailwindcss: .../packages/ui/src/styles/globals.css:1:1:
  Can't resolve 'shadcn/tailwind.css'
  ```

  原因是 `globals.css` 第 3 行 `@import "shadcn/tailwind.css"`，它是构建期依赖，不只是 CLI。还原依赖后构建恢复。`cn@0.2.6`（经 `shadcn` → `@shadcn/registry`）与 `cn@0.5.2` 并存作为已知现状接受；用 override 强制统一存在 registry 兼容风险，不做。
- 现有组件安装命令 `pnpm dlx shadcn@latest add ... -c apps/frontend` 保持不变。
- `@types/node` 保持 `^26.6.6`。26.x 没有比 26.6.6 更新的版本，之前“落后运行时”的判断不成立。

### D7. `.claude/skills` 统一为普通文件

把 6 个 `openspec-*` 链接替换为与 `.agents/skills` 内容相同的普通文件，使 `.claude/skills` 在 git 中全部是 `100644`。`cmp` 已确认当前链接目标内容与 `.agents` 一致。

理由：Windows 默认 `core.symlinks=false`，链接在干净克隆里会变成文本文件，技能直接失效；`.agents/skills/.openspec-target` 也表明 OpenSpec 的目标是“agents + claude own-files”，即两处各自持有文件。

替代：全部提交为 symlink。要求每个 Windows 贡献者开启 `core.symlinks` 与开发者模式，门槛过高。

风险：两处副本可能随 OpenSpec 升级漂移。README / CLAUDE 明确写“同步副本”，升级 OpenSpec 后需要人工比对；本变更不做自动同步脚本，避免再引入一套工具。

### D8. TypeScript 严格度只加两项

`packages/typescript-config/base.json` 增加：

```json
"noFallthroughCasesInSwitch": true,
"noImplicitOverride": true
```

两项都是低改造成本的正确性开关。`verbatimModuleSyntax` 与 `exactOptionalPropertyTypes` 会牵动 Nest emit、`import type` 写法与现有代码，留到业务模块落地时单独评估。

### D9. `.vscode` 只跟踪协作配置

`.gitignore` 从整体忽略 `.vscode/` 改为：

```gitignore
.vscode/*
!.vscode/extensions.json
!.vscode/settings.json
```

新增：

```json
// .vscode/extensions.json
{ "recommendations": ["oxc.oxc-vscode"] }
```

```json
// .vscode/settings.json
{
  "editor.defaultFormatter": "oxc.oxc-vscode",
  "editor.formatOnSave": true,
  "oxc.enable.oxfmt": true,
  "files.eol": "\n",
  "json.schemaDownload.trustedDomains": { "https://ui.shadcn.com": true }
}
```

理由：Oxc 官方扩展 `oxc.oxc-vscode` 不内置二进制，但会在 `node_modules` 中找本仓已安装的 `oxfmt`；`components.json` 使用 `https://ui.shadcn.com/schema.json`，需要信任域才能消掉 VSCode 的 schema 警告。个人设置仍可在用户级覆盖。

替代：不跟踪 `.vscode`，继续让每个开发者自行配置。会让 `CLAUDE.md` 里的 schema 约定无法落地，放弃。

### D10. Windows 长路径写入文档，不写仓库配置

删除 worktree 时已实际遇到 `Filename too long`。`core.longpaths` 是机器级 git 配置，不能可靠地随仓库分发；README 的“开发环境”补一条：

```bash
git config --global core.longpaths true
```

替代：提交 `.gitconfig` 或要求 `git config --local`。前者不会被 git 自动读取，后者只影响当前克隆，都会给新成员制造隐性门槛。

### D11. `pnpm ignored-builds` 作为待查项

当前在根目录与 `apps/backend` 执行都返回：

```text
Automatically ignored builds during installation:
  Cannot identify as no node_modules found
```

但 `node_modules/.modules.yaml` 有 `allowBuilds: { esbuild: true }`、`pendingBuilds: []`。没有证据表明有安装脚本被静默阻断，因此不在本变更里修改 `allowBuilds`。实施时记录：在干净克隆、Linux 或 CI 上复现；若确认是 pnpm 12 与 Windows 非 ASCII 路径的兼容问题，写入文档或上游 issue；若只是命令限制，关闭该项。

### D12. 文档同步与跨变更边界

按 `.claude/rules/doc-sync.md` 更新：

- 根 `README.md`：环境变量、脚本包装、端口变量、Windows 长路径、`.vscode`。
- 根 `CLAUDE.md` / `AGENTS.md`：Turbo env 规则、`.vscode`、skill 副本说明。
- `apps/backend`、`apps/bff` 的 README / CLAUDE：端口变量名。
- `openspec/config.yaml` 的 `context`：根 `.env` 加载方式与 `BACKEND_PORT` / `BFF_PORT`。

CI 变更落地时，必须把 `.github/**/*.yml` 与 `renovate.json` 加入 `format:root` 清单；这作为两个变更之间的交接说明，不在本变更实现。

## Risks / Trade-offs

- **Turbo bin 路径耦合** → 实施时验证 `turbo/package.json` 的 `bin` 字段；升级 Turbo 后重跑一次 `pnpm dev` / `pnpm build`。
- **缺 `.env` 时的提示噪声** → 只影响日志首行，不改退出码；文档写明这是预期行为。
- **`.env*` 全局失效** → 修改 `.env.example` 也会让所有任务 miss 一次；接受，换取缓存正确性。
- **缓存键调整后首轮全 miss** → 预期行为；验证时先跑一轮建立缓存，再做“改配置后是否命中”的对照。
- **TypeScript 新开关暴露旧代码问题** → 若报错，优先修代码；确属框架限制时在 `nestjs.json` 局部关闭并记录原因。
- **`shadcn` 是构建期依赖** → 已确认不能删除；`globals.css` 的 `@import "shadcn/tailwind.css"` 是硬依赖，保留 catalog 条目与 UI devDependency。
- **skill 副本漂移** → 文档写明升级 OpenSpec 后比对 `.agents/skills` 与 `.claude/skills`；后续可加校验脚本。
- **`.vscode` 与个人设置冲突** → 只提交两个协作文件，其余继续忽略。
- **端口改名遗漏引用** → 实施时全仓搜索 `PORT`、`5000`、`4000`，同步所有文档与脚本。

## Migration Plan

1. 开分支 `feat/workspace-config-hardening-2`，按“脚本与 Turbo → 端口 → 根格式化 → 元数据 → skill → TS → `.vscode` → 文档”的顺序改。
2. `pnpm install` 更新锁文件；确认 `pnpm why shadcn` 仍指向 `@workspace/ui`，`globals.css` 的 `shadcn/tailwind.css` 可解析。
3. 运行全量质量命令：`pnpm lint`、`pnpm format`、`pnpm format:root`、`pnpm check-types`、`pnpm test`、`pnpm build`。
4. 缓存与运行时验证：
   - 无 `.env` 时 `pnpm build` 退出 0；
   - `BACKEND_PORT=5100 BFF_PORT=4100 pnpm dev`，分别请求 `:5100/health` 与 `:4100/health`；
   - 修改 `.oxlintrc.json` 后 `pnpm build` 仍全命中，`pnpm lint` miss；
   - 修改任意文档后 `pnpm format:root` 命中；
   - 修改 `.env` 后 `turbo run build --dry=json` 的 hash 变化。
5. 更新文档与 `openspec/config.yaml`，跑 `pnpm exec openspec validate --all`。
6. 合并回 `main`；回滚方式是 revert 单个提交，本地 `.env` 不受影响。

## Implementation Notes

### `pnpm ignored-builds` 的复现结论

- 在本仓库（路径含中文）执行 `pnpm ignored-builds -C .` 与 `-C apps/backend`，均返回 `Cannot identify as no node_modules found`；但 `node_modules/.modules.yaml` 明确有 `pendingBuilds: []` 与 `allowBuilds: { esbuild: true }`。
- 在纯 ASCII 临时目录（`pnpm-ib-check`）用 pnpm 12.18.0 安装 `esbuild` 后，`pnpm ignored-builds` 正常输出 `esbuild`，并给出 `approve-builds` 提示。
- 结论：这是 pnpm 12 在 Windows 非 ASCII 工作区路径下识别 `node_modules` 的缺陷，不是仓库漏配。当前没有未知的被阻断安装脚本，不修改 `allowBuilds`。确需审计时，在 ASCII 路径的克隆或 Linux CI 上执行。

## Open Questions

无。
