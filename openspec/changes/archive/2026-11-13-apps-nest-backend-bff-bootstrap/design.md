# Design

## Context

`apps/backend` 与 `apps/bff` 目前是空目录。根目录已有 pnpm workspace、`engineStrict`、Turbo `dev` 与 `backend`/`frontend` catalog 的注释占位；Node 26.12.1、pnpm 12.18.0。原设计把 BFF 放在 Next Route Handlers，现在改为独立 Nest 服务，Next 只保留前端角色。

约束：

- 只做骨架，不引入数据库、模型调用、A2A、MCP 或业务模块。
- 不生成测试、lint、format、README/AGENTS，用户后续统一处理。
- 两个 app 都必须能被根 `pnpm dev` 通过 Turbo 同时拉起。
- 端口固定为 `3000`（前端预留）、`4000`（BFF）、`5000`（backend）。

## Goals / Non-Goals

**Goals:**

- 两个 Nest 12 服务能用最小依赖集完成 `install`、`build`、`start`。
- 依赖版本集中到 `backend` catalog，两个 app 不各自漂移。
- 端口、健康检查、启动脚本固定下来，后续模块直接往里加。

**Non-Goals:**

- 不做 BFF 到 backend 的代理、鉴权、聚合、SSE。
- 不生成 Vitest、oxlint、Prettier、README、AGENTS。
- 不建 `apps/frontend`，不更新技术架构图。
- 不引入 `@nestjs/config`、`@nestjs/axios`、`@nestjs/swagger`。

## Decisions

### 1. backend 与 BFF 都用 Nest 12

BFF 模式要求的是“面向某个前端的独立适配层”，不要求 Next。独立 BFF 用 Nest 更常见，模块、Guard、Interceptor、Validation 都能直接用；两个 Nest app 还能共享同一套版本与构建方式。

替代方案：Next Route Handlers。被否，因为它是和 UI 同进程的薄适配，不符合本项目“独立 BFF 层”的边界；而且 Next 前端后续仍要单独建，BFF 再塞进去会让 Next 同时承担 UI 和服务两层职责。

替代方案：把 BFF 合并成 backend 的一个 module。被否，因为论文需要清晰的 BFF 层；等打包成本真的成问题时再合并。

### 2. 只保留最小文件集

每个 app 只保留：

```text
package.json
nest-cli.json
tsconfig.json
tsconfig.build.json
src/main.ts
src/app.module.ts
src/app.controller.ts
```

不生成 `app.service.ts`、`app.controller.spec.ts`、`test/`、`vitest.config.*`、`.oxlintrc.json`、`.prettierrc`、`README.md`、`AGENTS.md`、`.gitattributes`。健康检查直接由 controller 返回，不需要 service。

替代方案：保留 Nest 默认的 17 个文件。被否，因为用户明确要求“不需要多余的文件”，测试与 lint 后续统一加。

### 3. 端口按请求链路排

```text
Next 前端   3000   （本批不建，预留）
Nest BFF    4000
Nest backend 5000
```

Nest 默认 3000，两个 app 同时启动会冲突；按请求链路分配也方便在文档和架构图里讲清楚。

### 4. 两个 app 共用 `backend` catalog

`pnpm-workspace.yaml` 的 `backend` catalog 放同一组版本：

- `@nestjs/common`、`@nestjs/core`、`@nestjs/platform-express`：`^12.5.0`
- `reflect-metadata`：`^0.2.2`
- `rxjs`：`^7.8.2`
- `@nestjs/cli`：`^12.0.12`
- `@nestjs/schematics`：`^12.0.13`
- `@types/express`：`^5.0.6`
- `@types/node`：`^26.6.6`
- `typescript`：`^6.0.3`

版本依据是 Nest 12 的 `ts-esm` 模板，不追最新：TypeScript 最新是 7.0.2，但 Nest 12 模板用 6.0.x；Vitest 最新是 5.x，但本批不引入。`@types/node` 用 26 对齐运行时，比模板里的 24 新；已在临时目录用这组依赖跑通 `nest build`，失败时再回退 24.19.2。

### 5. 使用 Nest 12 的 ESM 模板

生成器默认输出 `"type": "module"`、`module: nodenext`、`main.ts` 顶层 `await`。保留 ESM，不改成 CommonJS：后续 LangGraph/LangChain 生态以 ESM 为主，早统一比后改便宜。

### 6. 健康检查只做连通性

- backend：`GET http://localhost:5000/health` → `{ "status": "ok", "service": "backend" }`
- BFF：`GET http://localhost:4000/health` → `{ "status": "ok", "service": "bff" }`

不做 BFF → backend 的转发，避免在骨架阶段引入 HTTP 客户端和错误处理。

### 7. 去掉 `nest-cli.json` 的远程 `$schema`

生成模板带 `https://json.schemastore.org/nest-cli`。按根目录的 JSON Schema 约定，不为了编辑器提示引入远程 schema；删掉这一行，保留 `collection`、`sourceRoot`、`compilerOptions`。

## Risks / Trade-offs

- **多一个 Nest 进程** → 桌面本地运行可接受；如果 Electron 打包后启动链路过重，再把 BFF 合并为 backend 的 module。
- **技术架构图会过期** → 图里 BFF 仍挂在 Next 侧。本批不改图，作为后续单独变更处理；文档同步任务里会记录。
- **没有测试与 lint** → 骨架阶段只验证 build/start/health；用户后续统一引入 Vitest/oxlint/Prettier。
- **`@types/node` 26 比 Nest 模板新** → 已用最小依赖集临时验证 `nest build` 通过；若后续类型报错，回退 `^24.19.2`。
- **两个 watch 进程的日志会混在 Turbo TUI** → 用 `pnpm --filter backend dev` / `pnpm --filter bff dev` 单独调试。
- **`nest-cli.json` 没有 `$schema`** → 编辑器少一点提示，但不会出现远程 schema 信任警告。

## Migration Plan

1. 用 Nest CLI 12.0.12 在 `apps/backend`、`apps/bff` 生成标准骨架（`--skip-install --skip-git --strict --no-observe`）。
2. 删除 service、测试、Vitest、oxlint、Prettier、README/AGENTS、`.gitattributes`；`tsconfig.json` 的 `types` 改为 `["node"]`。
3. 修改 `main.ts` 端口，controller 改为 `/health`；`nest-cli.json` 去掉远程 `$schema`。
4. 把 `pnpm-workspace.yaml` 的 `backend` catalog 从注释改为实际版本，两个 app 的 `package.json` 改用 `catalog:backend`。
5. 根目录 `pnpm install`，分别 `pnpm --filter backend build`、`pnpm --filter bff build`。
6. `pnpm dev` 同时启动，curl 两个 `/health`。
7. 同步 README/CLAUDE/AGENTS 与 `openspec/config.yaml` 的 `context`。

回滚：删除两个 app 目录、还原 catalog 与 lockfile、还原文档即可；不涉及数据库或外部状态。
