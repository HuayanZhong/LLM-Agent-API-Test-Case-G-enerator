# CLAUDE.md

本文件是 `apps/backend` 的包级规则。项目级规则见 [../../CLAUDE.md](../../CLAUDE.md)。

## 本包职责

本地领域服务：接口 / 契约 / 用例 / 比对 / 知识 / 报告。BFF 通过 HTTP 调用本包。

## 命令与端口

```bash
pnpm --filter backend dev     # 5000
pnpm --filter backend build
pnpm --filter backend test    # vitest run --coverage，行覆盖率 ≥ 95%
pnpm --filter backend test:watch
pnpm --filter backend start:prod
```

端口读 `process.env.PORT ?? 5000`；不要占用 3000 或 4000。

## 目录与入口

- 启动：`src/main.ts`；根模块：`src/app.module.ts`；现有路由：`src/app.controller.ts`。
- 单元测试：`src/**/*.spec.ts`，与源码同目录（Nest 官方模板口径）；e2e 后续放 `test/**/*.e2e-spec.ts`。
- 业务模块按领域放 `src/<domain>/`，在 `AppModule` 注册；跨模块依赖用 Nest provider，不直接 import 其他 app。

## 本包约束

- ESM：`"type": "module"`，所有相对 import 必须带 `.js` 后缀。
- `tsconfig.json` 使用 `module: nodenext`、`types: ["node"]`；不要把 `vitest/globals` 加回来，`nest build` 会失败。
- 测试配置继承 `@workspace/vitest-config/base`；`include` 只认 `src/**/*.spec.ts`，不要写 `vitest/globals`。
- 覆盖率只卡行覆盖率 95%（`coverage.thresholds.lines`）；`src/main.ts` 是 bootstrap 入口，已在 `coverage.exclude` 中排除。
- `nest build` 会先删 `dist/`（`deleteOutDir`）；`tsconfig.build.json` 的 `**/*spec.ts` 保证测试不进 dist。
- 系统红线：只诊断与复验，不改被测代码；测试报告是唯一交付物。业务实现时不要越界。
- 当前没有数据库、Agent 与 lint；测试已接入，但只有 `health` 冒烟用例。新增能力先走 OpenSpec 提案。

## 改动前读什么

- 端口与全局命令：[../../README.md](../../README.md)
- BFF 边界：[../bff/CLAUDE.md](../bff/CLAUDE.md)
- 文档同步：[../../.claude/rules/doc-sync.md](../../.claude/rules/doc-sync.md)
- 注释规则：[../../.claude/rules/code-comments.md](../../.claude/rules/code-comments.md)

## 验证

- `pnpm --filter backend build` 退出码 0。
- `pnpm --filter backend test` 用例通过，行覆盖率 ≥ 95%。
- `pnpm --filter backend dev` 后 `curl http://localhost:5000/health` 返回 `{"status":"ok","service":"backend"}`。
