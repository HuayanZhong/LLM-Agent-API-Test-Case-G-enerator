# apps/bff

独立 BFF 骨架：NestJS 12 + ESM，默认监听 4000（`BFF_PORT` 可覆盖）。

## 职责

- 面向前端聚合后端接口，承担会话、SSE 进度与响应裁剪。
- 不承载领域规则；接口契约、用例、比对等逻辑属于 `apps/backend`。
- 当前只有 `GET /health`，返回 `{"status":"ok","service":"bff"}`。

## 运行

在仓库根目录执行：

```bash
pnpm --filter bff dev        # nest start --watch，4000
pnpm --filter bff build      # nest build，输出 dist/
pnpm --filter bff start      # nest start
pnpm --filter bff start:prod # node dist/main
pnpm --filter bff lint       # oxlint .，根配置
pnpm --filter bff format     # oxfmt --check .，根配置
```

端口读 `BFF_PORT`，未设置时用 4000。根 `pnpm dev` 会通过 Turbo 传入该变量。

## 目录

```text
apps/bff/
+-- src/
|   +-- main.ts          # NestFactory；listen(BFF_PORT ?? 4000)
|   +-- app.module.ts    # 根模块
|   +-- app.controller.ts# GET /health
+-- nest-cli.json        # sourceRoot: src，deleteOutDir
+-- tsconfig.json        # nodenext + types: ["node"]
```

## 依赖与边界

- 依赖走 `pnpm-workspace.yaml` 的 `backend` catalog；`typescript`、`@types/node` 走 `tooling`。
- 与 backend 之间用 HTTP 调用，不直接 import backend 的源码。
- 当前没有鉴权、CORS、SSE 实现；测试与 lint / format 已接入。

## 相关文档

- 包级 AI 规则：[CLAUDE.md](CLAUDE.md)
- 跨工具入口：[AGENTS.md](AGENTS.md)
- 项目总览：[../../README.md](../../README.md)
- 本地服务：[../backend/README.md](../backend/README.md)
