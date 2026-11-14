# Tasks

## 1. Turbo 任务与根脚本

- [x] 1.1 `turbo.json` 新增 `build` 任务（`dependsOn: ["^build"]`，`outputs: [".next/**", "!.next/cache/**", "dist/**", "storybook-static/**"]`），根 `package.json` 增加 `"build": "turbo run build"`；用 `pnpm turbo run build --dry=json` 验证任务被识别、`pnpm build` 只跑三个有 build 脚本的 app 并退出 0
- [x] 1.2 `turbo.json` 的 `globalDependencies` 增加 `.editorconfig`、`.nvmrc`；用 `pnpm turbo run format` 预热缓存，改 `.editorconfig` 的 `indent_size` 后重跑验证 cache miss，再恢复文件
- [x] 1.3 `turbo.json` 增加根任务 `//#format:root` 与 `//#format:root:fix`（fix 不缓存），根 `package.json` 增加 `format:root` / `format:root:fix` 并显式列出 oxfmt 支持的根配置文件（`.editorconfig` 无 oxfmt parser，只作为缓存输入）；用 `pnpm format:root` 与 `pnpm format:root:fix` 验证退出 0，`pnpm turbo run format:root --dry=json` 验证根任务被识别

## 2. Vitest 测试发现与覆盖率

- [x] 2.1 `apps/frontend/vitest.config.ts` 与 `packages/ui/vitest.config.ts` 的 `include` 改为 `__tests__/**/*.test.{ts,tsx}`；用 `pnpm --filter @workspace/ui exec vitest list --filesOnly` 确认列出 `utils.test.ts`，`pnpm --filter @workspace/ui test` 验证 3 个文件 / 5 个用例通过且行覆盖率 ≥ 95%
- [x] 2.2 `packages/vitest-config/src/index.ts` 的 reporter 改为 `["text", "lcov", "json-summary"]`；用 `pnpm test` 验证 4/4 通过，`coverage/lcov.info` 与 `coverage/coverage-summary.json` 在四个包目录生成，行覆盖率仍 ≥ 95%

## 3. 仓库与 MCP 配置

- [x] 3.1 `.gitignore` 增加 `.worktrees/` 段；用 `git check-ignore -v .worktrees/` 验证命中 tracked `.gitignore` 而不是 `.git/info/exclude`
- [x] 3.2 `.mcp.json` 移除 Storybook HTTP 端点，只保留 chrome-devtools；用 `cat .mcp.json` 与一次会话启动验证不再出现 Storybook `ECONNREFUSED`
- [x] 3.3 `pnpm-workspace.yaml` 显式写 `minimumReleaseAge: 1440` 并修正 `minimumReleaseAgeExclude` 注释；用 `pnpm install` 验证安装成功、`pnpm config get minimumReleaseAge` 返回数值

## 4. 文档同步

- [x] 4.1 更新根 `README.md`：目录树补 `.nvmrc` / `.editorconfig` / `.gitattributes` / `skills-lock.json`，命令块补 `build` / `format:root` / `format:root:fix`，修正 `.mcp.json` 描述与 Storybook 启用方式，补 lcov / json-summary 说明与 HTML 按需生成方式
- [x] 4.2 更新根 `CLAUDE.md` 与 `AGENTS.md`：常用命令、Turbo 任务（新增 `build`、根格式化任务）、仓库结构、MCP 描述
- [x] 4.3 更新 `packages/ui/CLAUDE.md`（`.test.ts` 约定）与 `packages/vitest-config/README.md` / `CLAUDE.md`（reporter 变更）
- [x] 4.4 更新 `openspec/config.yaml` 的 `context`：补 Turbo build、format:root、覆盖率 reporter；用 `pnpm exec openspec context --json` 验证可解析

## 5. 集成验证

- [x] 5.1 依次执行 `pnpm lint`、`pnpm format`、`pnpm format:root`、`pnpm check-types`、`pnpm test`、`pnpm build`，验证全部退出 0；再跑一次 `pnpm build` 验证 Turbo 缓存命中
- [x] 5.2 执行 `pnpm --filter frontend build`、`pnpm --filter backend build`、`pnpm --filter bff build`，确认 `dist` 无测试文件、前端 `.next` 产物正常
- [x] 5.3 执行 `pnpm exec openspec validate --all` 与 `pnpm exec openspec status --change "workspace-config-hardening"`，验证通过且 proposal / design / tasks 为 done
- [x] 5.4 复查文档一致性：`grep` 确认 README / CLAUDE / AGENTS 不再出现“只含 chrome-devtools”，命令块中的脚本都存在

## 6. package.json 完整度与版本规范

- [x] 6.1 六个 workspace 包的 `package.json` 补齐 `description`、`license`、`engines.node`，统一 `version: 0.0.0`、`private: true`；用 `node` 脚本逐包读取验证字段齐全、版本一致
- [x] 6.2 运行 `pnpm format:fix` 让 Oxfmt 统一键顺序；用 `pnpm install --frozen-lockfile`、`pnpm test`、`pnpm build`、`pnpm lint` 验证归一化后依赖解析与任务链不变

## Workflow follow-up

- 计划评审通过后，按 `openspec-apply-change` 实施。
- 实施与验证完成后，按 `openspec-archive-change` 归档到 `openspec/changes/archive/`。
