# Tasks

## 1. 依赖与配置

- [x] 1.1 在 `pnpm-workspace.yaml` 的 `tooling` catalog 增加 `knip`（`^6.45.1`）与 `sherif`（`^1.13.0`），根 `package.json` 增加对应 devDependencies 与 `knip` / `knip:fix` / `sherif` 脚本；执行 `pnpm install`，验证 `pnpm exec knip --version` 与 `pnpm exec sherif --version` 输出版本号
- [x] 1.2 创建根 `knip.jsonc`：`$schema` 指向 `./node_modules/knip/schema.json`，按 workspace 声明入口与工程文件，忽略 `openspec/`、`doc/`、`.claude/`、`.agents/` 与构建产物，`ignoreDependencies` 写明 `@fission-ai/openspec`、`shadcn` 的原因；验证 `pnpm knip` 能运行并输出分类结果
- [x] 1.3 把 `knip.jsonc` 加入根 `format:root` / `format:root:fix` 的文件清单与 `turbo.json` 的 `//#format:root` inputs；验证 `pnpm format:root` 退出码 0
- [x] 1.4 运行 `pnpm sherif` 确认零配置下当前仓库通过；若出现有意保留的版本分歧，用脚本参数逐条豁免并在根文档记录原因，最终 `pnpm sherif` 退出码 0

## 2. 首轮 findings 清零

- [x] 2.1 运行 `pnpm knip` 并记录 findings，按「未使用依赖 / 未声明依赖 / 死文件 / 死导出 / 误报」分类；验证分类覆盖输出中的每一项
- [x] 2.2 删除真实的未使用依赖与死文件 / 死导出，保留 `packages/types`、`packages/config` 入口文件里的公开 API；每改一个包后跑该包 `check-types` 与 `test`，最终 `pnpm knip` 退出码 0
- [x] 2.3 处理幽灵依赖与误报：优先补声明或改回已声明的包；确认属于 CLI-only、CSS-only 或入口导出的项写入 `knip.jsonc` 并注明原因；验证每条 ignore 都有对应说明，且 `pnpm install --frozen-lockfile` 通过

## 3. CI 门禁

- [x] 3.1 在 `.github/workflows/quality.yml` 的 `pnpm check-types` 之后增加 `pnpm sherif` 与 `pnpm knip`，与现有步骤共用安装；验证 `pnpm format:root` 仍通过、workflow YAML 无格式问题

## 4. 文档与索引

- [x] 4.1 更新 `README.md` 的命令清单与质量检查说明，加入 `pnpm sherif`、`pnpm knip` 与 `knip:fix` 的使用边界；验证命令能在仓库根执行
- [x] 4.2 更新 `CLAUDE.md` 与 `AGENTS.md`：命令、CI 步骤、`knip.jsonc` 入口与豁免规则、sherif 零配置与豁免方式；验证文中路径存在
- [x] 4.3 更新 `openspec/config.yaml` 的 `context`，写入 knip 与 sherif 门禁及 CLI-only 依赖豁免；验证 `openspec validate --all` 退出码 0

## 5. 集成验证

- [x] 5.1 在仓库根执行 `pnpm sherif`、`pnpm knip`、`pnpm check-types`、`pnpm lint`、`pnpm format`、`pnpm format:root`、`pnpm test`，确认全部退出码 0
- [x] 5.2 执行 `pnpm build` 确认四个 app 构建成功；确认 `quality.yml` 已包含 `pnpm sherif` 与 `pnpm knip`、`knip.jsonc` 已进入根格式检查

## Workflow follow-up

- 实现与验证完成后运行 `openspec-archive-change` 归档本变更；本变更已声明 `skip_specs: true`，归档时无需同步主规格。
