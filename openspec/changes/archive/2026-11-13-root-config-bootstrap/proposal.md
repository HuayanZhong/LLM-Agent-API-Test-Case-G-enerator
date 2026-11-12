# Proposal

## Why

根目录目前只有包管理、Turbo、OpenSpec 与 AI 规则，缺少工程一致性和环境骨架。`apps/` 下还没有源码，此时把行尾、Node 版本、环境变量和 Claude 权限行为一次性定下来成本最低；等第一个 app 落地后再补，容易让各包形成不同约定。

## What Changes

- 包管理：在 `pnpm-workspace.yaml` 中开启 `engineStrict: true`，让 `package.json` 的 `engines` 真正拦截错误版本（pnpm 12 已不再读取 `.npmrc` 的 `engine-strict`）；暂不预设 `node-linker`，也不强制 peer 依赖。
- 工程一致性：新增 `.editorconfig`（UTF-8、LF、2 空格、末尾换行）和 `.gitattributes`（文本文件 `eol=lf`、Windows 脚本 CRLF、二进制文件标注）；**不新增** `tsconfig.base.json`，留到第一个 TypeScript 包时再定。
- 环境与密钥：在根目录只放一个空的 `.env.example` 作为统一声明入口；技术选型确认前不写变量，也不写入真实密钥。
- AI 协作：新增 `.mcp.json`（chrome-devtools MCP，固定版本）与 `.claude/commands/opsx.md`（OpenSpec 快捷入口）；不配置项目级权限规则。
- 仓库忽略：补充 `.next/`、`.claude/settings.local.json`、`!.env.*.example`，避免构建产物被提交、env 模板被误忽略。

无破坏性变更。

## Capabilities

纯工程配置，不改变任何系统行为，`.openspec.yaml` 已声明 `skip_specs: true`。

### New Capabilities

- 无。

### Modified Capabilities

- 无。

## Impact

- 受影响文件：根目录 dotfiles、`apps/*/.env.*.example`、`.claude/`、`.mcp.json`。
- 不影响运行时代码、API 或依赖版本，也不新增 workspace 包。
- 开发环境：Node 或 pnpm 版本不符时，`pnpm install` 直接失败，而不是留下模糊警告。
- 后续工作：第一个 app 落地时再补 `tsconfig.base.json`、ESLint/Prettier、Vitest 与 CI。
