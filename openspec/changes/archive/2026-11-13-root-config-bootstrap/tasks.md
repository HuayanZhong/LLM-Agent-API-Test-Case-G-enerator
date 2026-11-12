# Tasks

## 1. 包管理与工程一致性

- [x] 1.1 在 `pnpm-workspace.yaml` 中新增 `engineStrict: true`；验证：`pnpm config get engineStrict` 输出 `true`，且当前 Node/pnpm 下 `pnpm install` 成功。
- [x] 1.2 新增 `.editorconfig`，设置 UTF-8、LF、2 空格、末尾换行、去除行尾空格；验证：VSCode 打开 `.ts` 与 `.md` 时状态栏显示对应缩进和 LF。
- [x] 1.3 新增 `.gitattributes`，文本文件 `eol=lf`、Windows 脚本 CRLF、图片与字体标 binary；验证：`git check-attr text eol -- README.md doc/business-architecture.html package.json` 输出符合预期。

## 2. 环境与密钥骨架

- [x] 2.1 新增根目录 `.env.example`，保持为空；验证：文件为 0 字节，且 `git check-ignore -v --no-index .env.example` 显示被 `!.env.example` 放行。
- [x] 2.2 不新增 `.env.development.example` 与 `.env.production.example`，开发/生产变量统一后续写入 `.env.example`；验证：根目录只有 `.env.example`，`apps/` 下无 env 文件。
- [x] 2.3 更新 `.gitignore`，补充 `.next/`、`.claude/settings.local.json`、`!.env.*.example`；验证：`apps/frontend/.next/x` 被忽略，`apps/frontend/.env.local` 被忽略，根目录 `.env.example` 不被忽略。

## 3. AI 协作配置

- [x] 3.1 不新增 `.claude/settings.json`，权限沿用默认模式与全局设置；验证：文件不存在，`.mcp.json` 与 `/opsx` 不受影响。
- [x] 3.2 新增 `.mcp.json`，用 `pnpm dlx` 固定 `chrome-devtools-mcp@1.13.0`，不使用 `@latest`；验证：`pnpm dlx chrome-devtools-mcp@1.13.0 --version` 输出 `1.13.0`，JSON 解析通过，重启 Claude Code 后 MCP 列表出现 `chrome-devtools`。
- [x] 3.3 新增 `.claude/commands/opsx.md`，按第一个参数转发到 `openspec-explore`、`openspec-propose`、`openspec-apply-change` 等技能；验证：文件存在且 frontmatter 正确，重启后在 Claude Code 输入 `/opsx explore` 能进入 `openspec-explore`。

## 4. 文档与收尾

- [x] 4.1 更新 `README.md`，说明根目录 `.env.example` 是唯一声明入口（技术选型确认前保持为空）和 `/opsx` 入口，并补充 `engineStrict` 说明；验证：按 README 的说明能解释该文件的用途，且 `pnpm install` 与 `pnpm dev` 仍可执行。
- [x] 4.2 更新 `CLAUDE.md` 与 `AGENTS.md`，确保 `.mcp.json` 与 `/opsx` 被提及；验证：文档中引用的路径全部存在。
- [x] 4.3 跑 `pnpm exec openspec validate --all`，确认本变更通过；验证：命令退出码为 0，输出无错误。
- [x] 4.4 对照 proposal 的 Impact 检查 `openspec/config.yaml` 的 `context`，确认项目范围与技术栈描述仍准确；验证：无需修改时在变更说明中写明“context 无需更新”及原因。

## Workflow follow-up

- 变更评审通过后归档：`pnpm exec openspec archive root-config-bootstrap`。
- 归档后确认 `openspec/specs/` 未被本变更意外新增内容，并重跑 `pnpm exec openspec validate --all`。
