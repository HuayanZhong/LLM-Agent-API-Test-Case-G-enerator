# CLAUDE.md

本文件是 `apps/bff` 的包级规则。项目级规则见 [../../CLAUDE.md](../../CLAUDE.md)。

## 本包职责

独立 BFF：会话、SSE 进度、接口聚合。领域逻辑在 `apps/backend`，本包不复制。

## 命令与端口

```bash
pnpm --filter bff dev     # 4000
pnpm --filter bff build
pnpm --filter bff test    # vitest run --coverage，行覆盖率 ≥ 95%
pnpm --filter bff test:watch
pnpm --filter bff start:prod
```

端口读 `process.env.PORT ?? 4000`；不要硬编码到 3000 或 5000。

## 目录与入口

- 启动：`src/main.ts`；根模块：`src/app.module.ts`；现有路由：`src/app.controller.ts`。
- 单元测试：`src/**/*.spec.ts`，与源码同目录；e2e 后续放 `test/**/*.e2e-spec.ts`。
- 新增模块放 `src/<module>/`，并在 `AppModule` 里注册。

## 本包约束

- ESM：`"type": "module"`，所有相对 import 必须带 `.js` 后缀（`./app.module.js`）。
- `tsconfig.json` 使用 `module: nodenext`、`types: ["node"]`；不要把 `vitest/globals` 加回来，`nest build` 会因缺类型失败。
- 测试配置继承 `@workspace/vitest-config/base`；`include` 只认 `src/**/*.spec.ts`。
- 覆盖率只卡行覆盖率 95%（`coverage.thresholds.lines`）；`src/main.ts` 已在 `coverage.exclude` 中排除。
- `nest build` 会先删 `dist/`（`deleteOutDir`）；`tsconfig.build.json` 的 `**/*spec.ts` 保证测试不进 dist。
- BFF 只做聚合与会话：不要把用例生成、比对、知识沉淀写进本包。
- 调 backend 用 HTTP，不直接 import `apps/backend` 的源码。
- 当前没有鉴权、CORS、SSE 与 lint；测试已接入，但只有 `health` 冒烟用例。新增时先走 OpenSpec 提案。

## 改动前读什么

- 端口与全局命令：[../../README.md](../../README.md)
- 后端边界：[../backend/CLAUDE.md](../backend/CLAUDE.md)
- 文档同步：[../../.claude/rules/doc-sync.md](../../.claude/rules/doc-sync.md)
- 注释规则：[../../.claude/rules/code-comments.md](../../.claude/rules/code-comments.md)

## 验证

- `pnpm --filter bff build` 退出码 0。
- `pnpm --filter bff test` 用例通过，行覆盖率 ≥ 95%。
- `pnpm --filter bff dev` 后 `curl http://localhost:4000/health` 返回 `{"status":"ok","service":"bff"}`。
