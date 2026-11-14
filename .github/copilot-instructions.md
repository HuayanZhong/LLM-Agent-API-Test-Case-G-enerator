# Copilot instructions

## 项目红线

- 系统只诊断与复验，不修改被测代码，不给修复方案。
- 测试报告是唯一交付物；关键节点由人确认。
- 不要把正常现场记录、GraphRAG / OKF 比对等具体能力抽象掉。

## 代码约定

- 注释只写「为什么 / 约束 / 后果」，不复述代码；规则见 `.claude/rules/code-comments.md`。
- 修改命令、依赖、workspace 结构或架构时，同步 README / CLAUDE / AGENTS / `doc/README.md` / OpenSpec context。
- 新功能或行为变更先走 OpenSpec 提案，不直接改业务代码。

## 测试与配置

- 质量命令：`pnpm lint`、`pnpm format`、`pnpm format:root`、`pnpm check-types`、`pnpm test`、`pnpm build`。
- 行覆盖率门槛 95%；测试文件按 Nest `src/**/*.spec.ts`、React `__tests__/**/*.test.{ts,tsx}`。
- 环境变量声明在根 `.env.example`；后端读 `BACKEND_PORT` / `BFF_PORT`，前端 `NEXT_PUBLIC_*` 放 `apps/frontend/.env.development` / `.env.production`。
- 不要在 PR 里提交 `.env`、密钥或真实数据。

## 审查重点

- 行为变更是否有测试或 OpenSpec 验收场景。
- 错误路径、超时、空值、并发与权限边界。
- 是否误改了 `turbo.json` 缓存键、CI 权限或 fork PR 行为。
