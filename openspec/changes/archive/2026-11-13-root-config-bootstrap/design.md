# Design

## Context

当前仓库是 pnpm monorepo 脚手架，`apps/frontend`、`apps/bff`、`apps/backend` 与 `packages/` 都还没有源码。根目录已有 `package.json`、`pnpm-workspace.yaml`、`turbo.json`、`.nvmrc`、`.gitignore` 与 OpenSpec 配置，但没有工程一致性、环境变量和 Claude 项目级配置。

约束：

- 开发机是 Windows，`core.autocrlf=true`，且没有 `.gitattributes`。
- Next.js 只从 `apps/frontend` 读取 env，NestJS 通过 `ConfigModule` 读取 `apps/backend` 的 env；根目录 `.env` 不会被自动加载。
- 规划中的 chrome-devtools MCP 尚未接入，版本需要可复现。
- 本批只做配置，不引入任何运行时代码或 workspace 包。

## Goals / Non-Goals

**Goals:**

- 用最小配置固定 Node/pnpm 版本、行尾、编码、env 模板和 AI 协作入口。
- 让新成员 clone 后按 README 复制 env 模板即可启动，不靠口头约定。
- 让 AI 协作配置跟仓库走，而不是只存在于某台机器的全局设置。

**Non-Goals:**

- 不新增 `tsconfig.base.json`；第一个 TypeScript 包落地时再定。
- 不引入 ESLint/Prettier/Biome、Vitest、CI、husky。
- 不配置 Supabase CLI、数据库迁移或 Electron 构建。
- 不处理真实密钥、生产环境变量值或密钥轮换。
- 不改造现有 `.claude/skills` 的符号链接结构。

## Decisions

### 1. 在 `pnpm-workspace.yaml` 中开启 `engineStrict: true`

pnpm 12 把这类设置收进了 `pnpm-workspace.yaml`，`.npmrc` 的 `engine-strict` 实测不再生效。开启后，`package.json` 的 `engines` 从声明变成实际拦截。暂不设置 `node-linker=hoisted` 和 `strict-peer-dependencies=true`：Electron、Next、Nest 的 peer 关系在项目初期容易误伤，等真实依赖进来再按错误逐个处理。

替代方案：继续写 `.npmrc`。被否，因为 pnpm 12 不读取该键，配置会变成无效声明。

### 2. 同时使用 `.editorconfig` 与 `.gitattributes`

`.editorconfig` 管编辑器内的缩进、编码和换行；`.gitattributes` 管 Git 检出/提交时的行尾归一化。两者职责不同，缺一不可。

- 文本文件统一 `eol=lf`。
- `*.bat`、`*.cmd`、`*.ps1` 使用 CRLF。
- 图片、字体标为 binary，避免 Git 尝试做文本 diff。

替代方案：只加 `.gitattributes`。被否，因为 VSCode 之外的编辑器仍可能写入 CRLF。

### 3. env 只在根目录保留一个空 `.env.example`

根目录只预留一个空文件：

```text
.env.example
```

技术栈尚未最终确认，提前写 `NEXT_PUBLIC_*`、`DATABASE_URL` 等变量会把未定的选型固化成文档，拆成 dev/prod 多份也会增加没有信息量的声明文件。当前只把它作为统一声明入口；等前后端框架、数据库和模型网关确认后，再决定是在同一个文件里用注释区分开发/生产，还是拆到各 app 目录。

替代方案：按环境或按 app 放置多份模板。被否，因为变量名依赖技术选型，现在写会误导，而且用户已明确要求只留一个入口。

### 4. 不配置项目级权限规则

用户认为当前没必要维护严格的命令白名单，`.claude/settings.json` 不纳入仓库。权限沿用 Claude Code 的默认模式与全局设置；等协作场景真的需要统一权限时再补。

替代方案：写最小 allow + deny 白名单。被否，因为当前是单人项目，维护成本大于收益，而且 deny 规则容易造成“已经限制过”的错觉。

### 5. `.mcp.json` 固定 chrome-devtools-mcp 版本

使用 `pnpm dlx chrome-devtools-mcp@1.13.0`，不写 `@latest`。用 pnpm 而不是 npx，是为了绕开 npm 对项目 `devEngines` 的校验；版本升级时改这一个文件，并在变更中记录。

替代方案：只放在用户级 MCP 配置。被否，因为换机或换协作者后不可复现。

### 6. `/opsx` 作为单入口转发，不建六个别名

`.claude/commands/opsx.md` 按第一个参数转发到 `openspec-explore`、`openspec-propose`、`openspec-apply-change` 等技能。保留一个入口，避免命令列表膨胀。

替代方案：为每个技能建 `/opsx-*` 别名。被否，因为与 2.0 的 `/openspec-*` 重复。

### 7. `.gitignore` 只补必要项

补充 `.next/`、`.claude/settings.local.json`、`!.env.*.example`。`.next/` 是 Next 的真实构建目录，现有规则只覆盖了 `dist/`、`build/`、`out/`；`!.env.*.example` 用于抵消 `.env.*` 对模板的误伤。

## Risks / Trade-offs

- **Windows 符号链接不可移植** → `.claude/skills/openspec-*` 在 `core.symlinks=false` 的机器上 clone 后可能变成普通文本文件。本批不改造，文档中注明开启 Developer Mode 或运行 `openspec update` 重建；若后续仍出问题，再改为真实副本。
- **`engineStrict` 会让版本不符直接失败** → 这是预期行为；升级 Node 时同步改 `.nvmrc` 与 `engines`，避免一个改了一个没改。
- **根目录 env 不会被 Next/Nest 自动加载** → 当前只是占位；技术选型确认后，在 README 写清是保留根目录统一管理，还是复制或拆到各 app 目录。
- **MCP 版本需要手工跟进** → chrome-devtools-mcp 不在 pnpm catalog 里，升级时要同时改 `.mcp.json` 和变更记录。
- **项目级权限规则不跟仓库走** → 换机后命令权限依赖默认模式与全局设置；当前单人项目可接受，需要统一时再补 `.claude/settings.json`。
- **`.gitattributes` 可能触发既有文件重归一化** → 当前仓库以新文件为主；如出现大量行尾 diff，用 `git add --renormalize .` 单独提交，不与功能改动混在一起。

## Migration Plan

1. 先在 `pnpm-workspace.yaml` 写 `engineStrict: true`，再写 `.editorconfig`、`.gitattributes`，跑一次 `pnpm install` 确认版本校验可用。
2. 在根目录放一个空的 `.env.example`，写 `.gitignore` 规则，用 `git check-ignore` 验证模板可被跟踪、真实 env 被忽略。
3. 写 `.mcp.json` 与 `.claude/commands/opsx.md`，重启 Claude Code 后确认 MCP 与 `/opsx` 可见。
4. 同步 README 的 env 复制说明与 Claude 配置说明。

回滚：以上都是新增文件与少量 ignore 规则，`git revert` 对应提交即可，不影响运行时代码。
