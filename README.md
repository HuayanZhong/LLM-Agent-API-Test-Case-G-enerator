# LLM-Agent-API-Test-Case-G-enerator

基于大模型智能体的接口测试用例辅助生成系统的设计与实现。

## 项目定位

系统面向「别人交付已做好的功能」这一前提：由 AI 按接口生成用例与测试数据（含爬页面采集），
由 Agent 执行测试，并将现场与正常现场记忆 / GraphRAG / OKF 进行比对；不一致时按记忆重放复现并
出具测试报告，经 A2A 派发；一致则记录带数据的正常现场并沉淀回流。

系统红线：只诊断与复验，不改代码；报告是唯一交付物；AI 干活、人拍板。

> 当前仓库以设计文档与业务架构图为主，可运行物与运行证据尚未纳入版本库。

## 目录结构

```
.
├── doc/                 # 业务架构 HTML、评审记录与视觉校验产物
├── apps/                # 应用（待建设）
├── packages/            # 共享包（待建设）
├── package.json
├── pnpm-workspace.yaml
├── turbo.json          # Turbo 任务配置（当前只注册 dev）
└── LICENSE             # MIT
```

## 开发环境

- Node.js >= 26.12.1
- pnpm >= 12.18.0（仓库锁定 `pnpm@12.18.0`，见 `packageManager`）

依赖版本统一放在 `pnpm-workspace.yaml` 的 `catalogs` 中管理；根 `package.json` 通过 `catalog:tooling` 引用 Turbo。

```bash
pnpm install
pnpm dev      # turbo run dev（各工作区 dev）
```

## 文档维护

改动命令、依赖、工作区结构或架构时，同步更新 `README.md`、`CLAUDE.md`、`AGENTS.md` 与 `doc/README.md`；完整规则见 [.claude/rules/doc-sync.md](.claude/rules/doc-sync.md)。

## 许可证

[MIT](LICENSE)
