# apps/backend

本地领域服务骨架：NestJS 12 + ESM，监听 5000。

## 职责

- 承载接口 / 契约 / 用例 / 比对 / 知识 / 报告等业务能力（后续实现）。
- 由 BFF 通过 HTTP 调用；不直接面向浏览器。
- 当前只有 `GET /health`，返回 `{"status":"ok","service":"backend"}`。

## 运行

在仓库根目录执行：

```bash
pnpm --filter backend dev        # nest start --watch，5000
pnpm --filter backend build      # nest build，输出 dist/
pnpm --filter backend start      # nest start
pnpm --filter backend start:prod # node dist/main
pnpm --filter backend lint       # oxlint .，根配置
pnpm --filter backend format     # oxfmt --check .，根配置
```

## 目录

```text
apps/backend/
+-- src/
|   +-- main.ts          # NestFactory；listen(PORT ?? 5000)
|   +-- app.module.ts    # 根模块
|   +-- app.controller.ts# GET /health
+-- nest-cli.json        # sourceRoot: src，deleteOutDir
+-- tsconfig.json        # nodenext + types: ["node"]
```

## 依赖与边界

- 依赖走 `pnpm-workspace.yaml` 的 `backend` catalog；`typescript`、`@types/node` 走 `tooling`。
- 不直接 import `apps/bff` 或前端源码；跨进程只走 HTTP / A2A。
- 当前没有数据库、Agent；测试与 lint / format 已接入。

## 相关文档

- 包级 AI 规则：[CLAUDE.md](CLAUDE.md)
- 跨工具入口：[AGENTS.md](AGENTS.md)
- 项目总览：[../../README.md](../../README.md)
- BFF：[../bff/README.md](../bff/README.md)
