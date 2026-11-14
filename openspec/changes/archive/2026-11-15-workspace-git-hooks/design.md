# Design

## Context

现状与约束均来自实际检查：

- `.git/hooks` 只有 `*.sample`；`git config core.hooksPath` 未设置；根 `package.json` 没有 `prepare`；仓库没有 `.husky`。
- 运行时 Node `26.12.1`、pnpm `12.18.0`；`pnpm-workspace.yaml` 有 `engineStrict: true` 与 `minimumReleaseAge: 1440`。
- 依赖可用性：`husky@9.1.7`（2024-11-18）、`lint-staged@17.6.0`（2026-09-26）、`@commitlint/cli@21.2.4` 与 `@commitlint/config-conventional@21.2.4`（2026-10-18）。都超过 1 天冷却期；`lint-staged` 要求 Node >= 22.22.1，满足。
- 根 `.oxlintrc.json` / `.oxfmtrc.json` 是唯一 Oxc 配置；`.oxfmtrc.json` 忽略 `**/*.md`、`.agents/**`、`.claude/**`、`doc/**`、`openspec/**`。各包只有 `oxlint .` / `oxfmt --check .` 这种整包脚本。
- CI 的 `quality.yml` 已跑 `pnpm lint`、`pnpm format`、`pnpm format:root`、`pnpm check-types`；安装走 `.github/actions/setup` 的 `pnpm install --frozen-lockfile`。

## Goals / Non-Goals

**Goals:**

- 提交时只校验暂存文件，不因整仓检查拖慢提交。
- 覆盖不属于任何 workspace 包的根文件与 `.github/`。
- 提交信息格式与现有 `type(scope): subject` 习惯一致。
- 不改变 CI 的判定标准，hook 只是提前发现问题。

**Non-Goals:**

- 不做 `pre-push` 的 `test` / `check-types` 全量检查。
- 不引入 lefthook 或其他 hook 管理器。
- 不在 hook 内自动 `git add` 或 `commit --amend`。
- 不改各包的 `lint` / `format` 脚本，也不加 lint-staged 的配置文件分片。
- 不把 hook 结果上报 CI，也不要求 CI 安装 hook。

## Decisions

### D1. husky + lint-staged，而不是 lefthook

- husky 9 只做 hook 挂载，lint-staged 负责按暂存文件分派命令，两者都是 JS 生态的常规组合，配置可直接读仓库已有的 Oxc 配置。
- lefthook 是独立二进制，并行更快，但多一条跨平台分发链，且与 `minimumReleaseAge` / `allowBuilds` 策略的交互需要额外验证。当前仓库规模不需要这个复杂度。
- 替代方案：`simple-git-hooks` 更轻，但没有 lint-staged 的暂存文件切片与 stash 处理，需要自己写取文件列表的脚本。

### D2. 只挂 `pre-commit` 与 `commit-msg`

```text
git add
   |
   v
pre-commit:  lint-staged  ->  oxlint --fix  ->  oxfmt
   |
   v
commit-msg:  commitlint --edit
```

- `pre-push` 不放：`pnpm check-types` 与 `pnpm test` 会跑 Turbo 多个任务，冷缓存时明显卡顿；CI 已经在 PR 上做同样的事，重复投入收益低。push 频率虽低，但热修复时最容易被它卡住。
- 替代方案：`pre-push` 只跑 `check-types`。放弃，因为类型错误在 `pre-commit` 之外仍应由 CI 判定，且本地增量缓存不可靠时体验差。

### D3. 在仓库根直接调 `oxlint` / `oxfmt`，不按包路由

lint-staged 传给命令的是绝对路径，直接交给根二进制即可：

```js
export default {
  "*.{ts,tsx,js,jsx,mjs,cjs}": ["oxlint --fix", "oxfmt"],
  "*.{json,jsonc,yaml,yml,css}": ["oxfmt"],
}
```

- 根配置 `.oxlintrc.json` / `.oxfmtrc.json` 会自动加载，`settings.next.rootDir` 等设置仍然有效。
- 不按包 `pnpm --filter <pkg> exec oxlint` 路由：需要解析路径到包，且包脚本是 `oxlint .`（整包），会把未暂存文件也扫进来，违背“只校验暂存”的目标。
- 第二条 glob 覆盖 `package.json`、`turbo.json`、`pnpm-workspace.yaml`、`.oxlintrc.json`、`.oxfmtrc.json`、`.mcp.json`、`skills-lock.json`、`renovate.json`、`.github/**/*.yml`，这些文件在 `format:root` 里本来就需要格式化。
- 不含 `*.md`：`.oxfmtrc.json` 已忽略 Markdown，放进 glob 只会多一次空转；Markdown 的行尾语义（双空格换行）也不适合自动格式化。

### D4. commitlint 用 conventional，但不能设 scope 白名单

- 现有提交形态是 `feat(ci): ...`、`docs(openspec): ...`、`chore(vitest-config): ...`，`config-conventional` 的 `type-enum` 已经覆盖 `feat` / `fix` / `docs` / `chore` / `ci` / `build` / `test` / `refactor` / `perf` / `style` / `revert`。
- scope 不设白名单：包名、`ci`、`openspec`、`workspace` 都可能出现，枚举会频繁误伤，先放开两周再决定。
- 关闭 `body-max-line-length` / `footer-max-line-length`：正文多为中文长句，按字符数卡行会产生无意义失败；header 仍限制 100，保证 `git log --oneline` 可读。
- 替代方案：自定义 `type-enum`。放弃，暂时没有偏离 conventional 的需求。

### D5. `prepare: "husky"` 与 CI 的关系

- husky 9 的安装方式是在根 `package.json` 写 `"prepare": "husky"`，`pnpm install` 时把 `core.hooksPath` 指向 `.husky/_`。
- CI 的 `pnpm install --frozen-lockfile` 也会执行 `prepare`：checkout 里有 `.git`，husky 正常写入，退出 0；即使失败也只在安装阶段，不影响后续质量命令。因此不加 `|| true`，避免掩盖真实错误。
- 替代方案：用 `pnpm exec husky init` 生成。实施时直接创建 `.husky/pre-commit` 与 `.husky/commit-msg` 并设置执行位，结果相同且更可控。

### D6. 跳过与部分暂存

- 逃生口是 `git commit --no-verify`，写进 README，避免有人在 hook 卡住时去改 hook 本身。
- lint-staged 会 stash 未暂存改动，跑完再恢复；hook 内不执行 `git add -A`，只让 lint-staged 把改过的暂存文件写回索引。
- 若 `oxlint --fix` 改写了文件，提交内容会包含修复后的版本，这是预期行为；想先看改了什么，用 `git diff --cached`。

### D7. 文档同步

- `README.md`：开发环境补“提交前 hook”一段，列出两个 hook 与 `--no-verify`。
- `CLAUDE.md`：常用命令后补 hook 说明，并写明“hook 与 CI 分工：hook 只查暂存，CI 跑全量”。
- `AGENTS.md`：入口索引加一行。
- `openspec/config.yaml` 的 `context`：补 hook 现状。

## Risks / Trade-offs

- **提交变慢** → 只处理暂存文件；`oxlint --fix` 单文件在百毫秒级，整体应低于 2 秒。
- **Windows 缺少 `sh`** → Git for Windows 自带；若 Git 安装时没带 shell，hook 会失败，README 写明需要 Git Bash。
- **部分暂存的冲突** → lint-staged 的 stash 机制可能在小概率下产生冲突；发生时按提示重试或先提交再改。
- **首次安装需联网** → 三个新依赖进 catalog，`pnpm install` 需要能访问 registry；CI 已有 `--frozen-lockfile`。
- **commitlint 误伤** → 不设 scope 白名单、关闭正文行长限制，降低摩擦；两周后按实际提交再收紧。
- **hook 与 IDE 自动提交冲突** → 某些 GUI 客户端不执行 hook；CI 仍兜底，不依赖 hook 保证质量。

## Migration Plan

1. catalog 与根 `devDependencies` 加依赖，`prepare` 指向 `husky`，`pnpm install` 更新锁文件。
2. 创建 `.husky/pre-commit`、`.husky/commit-msg`、`lint-staged.config.mjs`、`commitlint.config.mjs`。
3. 验证：暂存一个格式错误文件并提交，确认被修复；提交一条不符合 conventional 的信息，确认被拒绝；用 `--no-verify` 确认可跳过。
4. 更新文档与 `openspec/config.yaml`，跑 `pnpm lint` / `format` / `check-types` / `test` / `openspec validate --all`。
5. 回滚：删除 `.husky`、两个配置文件与四个依赖，移除 `prepare`。

## Open Questions

无。
