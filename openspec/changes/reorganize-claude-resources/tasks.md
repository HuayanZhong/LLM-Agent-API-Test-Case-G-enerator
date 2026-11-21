# Tasks

## 1. 前置测定

- [x] 1.1 测定 `skills-lock.json` 校验基准：确认升级 / 校验工具解析 hash 时的目标路径，判定 `.agents/skills/` 原目录能否删除（design.md 决策 5），结论作为备注写入 design.md。验证：备注明确「删或留」及依据。
- [x] 1.2 用 Glob 盘点仓库代码与文档文件后缀，拟定 `code-comments.md` 与 `doc-sync.md` 的 `paths:` glob 清单（覆盖 `*.ts` / `*.tsx` / `*.mts` / `*.cts` / `*.js` / `*.jsx` 与 `**/CLAUDE.md` / `**/README.md` / `**/AGENTS.md` / `openspec/**` / `doc/**` / `.github/**`）。验证：抽样核对 glob 与仓库实际文件路径匹配。

## 2. rules 按需化

- [x] 2.1 `.claude/rules/code-comments.md` 加 `paths:` 前置元数据（按 1.2 的代码文件 glob），正文不动。验证：frontmatter 语法正确、正文 diff 为零。
- [x] 2.2 `.claude/rules/doc-sync.md` 加 `paths:` 前置元数据（按 1.2 的文档文件 glob），正文不动。验证：frontmatter 语法正确、正文 diff 为零。
- [x] 2.3 根 `CLAUDE.md`「文档同步」节压缩为一句话触发器：保留触发条件摘要、必须同步的文件清单与指向 `.claude/rules/doc-sync.md` 的链接。验证：触发器常驻且链接可达。

## 3. skill 下沉

- [x] 3.1 将 `.agents/skills/shadcn` 与 `.agents/skills/migrate-radix-to-base` 复制到 `packages/ui/.claude/skills/`（含 `rules/` / `assets/` / `scripts/` 等全部参考文件）。验证：逐目录比对文件数一致。
- [x] 3.2 按 1.1 的结论处理 `.agents/skills/` 原目录（删除，或保留为升级中转站并在根 CLAUDE.md 注明）。验证：`skills-lock.json` 相关校验不报错。
- [x] 3.3 在根 `CLAUDE.md` 注明两个 skill 的新位置与「升级后手动从 `.agents/skills/` 同步到 `packages/ui/.claude/skills/`」的约定（若 1.1 结论为保留中转站，与 3.2 合并完成）。验证：约定文字与实际机制一致。

## 4. 文档同步

- [x] 4.1 更新根 `CLAUDE.md`「AI 协作配置」节：rules 按需加载机制、skill 新位置。验证：文档中每个路径实际存在。
- [x] 4.2 检查 `AGENTS.md`、`doc/README.md`、`openspec/config.yaml` 是否引用受影响路径；受影响则同步，不受影响则在提交说明写明「无需更新」理由。验证：逐文件检查结论留痕。

## 5. 集成验证

- [x] 5.1 开新会话验证加载时机：读代码文件时 `code-comments` 生效、读文档文件时 `doc-sync` 生效、`packages/ui` 子树会话可见两个下沉 skill 且仓库根会话不可见。验证：三项观察结果逐一记录。
- [x] 5.2 `pnpm format:root` 与 `pnpm knip` 通过。验证：两条命令退出码 0。
- [x] 5.3 `pnpm exec openspec validate --all` 通过。验证：退出码 0。

## Workflow follow-up

- 归档前确认 5.1–5.3 全部通过。
- Archive the change after the project's review requirements are satisfied.
