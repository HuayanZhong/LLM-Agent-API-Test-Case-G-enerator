# Tasks

## 1. 生成并裁剪 Nest 骨架

- [x] 1.1 用 `@nestjs/cli@12.0.12` 生成 `apps/backend` 与 `apps/bff`，参数为 `--skip-install --skip-git --strict --no-observe`；验证：两个目录都存在 `package.json`、`nest-cli.json`、`tsconfig.json`、`tsconfig.build.json`、`src/main.ts`。
- [x] 1.2 删除两个 app 的多余文件：`src/app.service.ts`、`src/app.controller.spec.ts`、`test/`、`vitest.config.*`、`.oxlintrc.json`、`.prettierrc`、`README.md`、`AGENTS.md`、`.gitattributes`；验证：`find apps/backend apps/bff -maxdepth 2 -type f` 只剩最小文件集。
- [x] 1.3 把两个 `tsconfig.json` 的 `types` 改为 `["node"]`，去掉 `vitest/globals`；验证：`grep -n '"types"' apps/backend/tsconfig.json apps/bff/tsconfig.json` 均输出 `["node"]`。

## 2. 端口与健康检查

- [x] 2.1 修改 `apps/backend/src/main.ts` 监听 `5000`，`app.controller.ts` 提供 `GET /health` 返回 `{ "status": "ok", "service": "backend" }`；验证：启动后 `curl http://localhost:5000/health` 返回该 JSON。
- [x] 2.2 修改 `apps/bff/src/main.ts` 监听 `4000`，`app.controller.ts` 提供 `GET /health` 返回 `{ "status": "ok", "service": "bff" }`；验证：启动后 `curl http://localhost:4000/health` 返回该 JSON。
- [x] 2.3 删除两个 `nest-cli.json` 中的远程 `$schema` 字段；验证：`grep -n '\$schema' apps/backend/nest-cli.json apps/bff/nest-cli.json` 无输出。

## 3. Catalog 与依赖

- [x] 3.1 在 `pnpm-workspace.yaml` 启用 `backend` catalog，加入 `@nestjs/common`、`@nestjs/core`、`@nestjs/platform-express`、`reflect-metadata`、`rxjs`、`@nestjs/cli`、`@nestjs/schematics`、`@types/express`、`@types/node`、`typescript` 的版本；验证：`pnpm config list` 能解析 catalog，且没有空分类报错。
- [x] 3.2 两个 `package.json` 的依赖改为 `catalog:backend`，脚本只保留 `dev`、`build`、`start`、`start:prod`；验证：`pnpm install` 成功，`cat apps/backend/package.json apps/bff/package.json` 不再出现硬编码版本。
- [x] 3.3 运行 `pnpm --filter backend build` 与 `pnpm --filter bff build`；验证：两条命令退出码均为 0，各自生成 `dist/`。

## 4. 启动、文档与收尾

- [x] 4.1 运行 `pnpm dev`，确认 Turbo 同时拉起两个服务；验证：`curl http://localhost:5000/health` 与 `curl http://localhost:4000/health` 返回预期 JSON，随后停止进程。
- [x] 4.2 更新 `README.md`、`CLAUDE.md`、`AGENTS.md`：补充 `apps/backend`/`apps/bff` 结构、3000/4000/5000 端口约定、`pnpm dev` 行为，并说明 BFF 已从 Next 改为 Nest；验证：文档中的路径与命令都能对应到实际文件。
- [x] 4.3 更新 `openspec/config.yaml` 的 `context`：当前状态改为两个 Nest 骨架已建，规划技术栈里的 BFF 改为 Nest，Next 只保留前端；验证：`context` 描述与仓库现状一致。
- [x] 4.4 运行 `pnpm exec openspec validate --all`；验证：退出码为 0，输出无错误。

## Workflow follow-up

- 技术架构图中 BFF 仍挂在 Next 侧，需单独更新 `doc/source/technical-architecture.candidate.json` 并重新生成 HTML。
- 后续统一引入 Vitest、oxlint、Prettier，并补 `test`/`lint`/`format` 脚本。
- 变更评审通过后用 `openspec-archive-change` 归档。
