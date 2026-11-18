# AGENTS.md

`packages/request` 是 workspace 的 HTTP 请求基础设施包(`@workspace/request`),ky 2 实例工厂与浏览器 preset,运行时工具,无构建。

- 本包说明:[README.md](README.md)
- 本包 AI 规则:[CLAUDE.md](CLAUDE.md)
- 根规则:[../../AGENTS.md](../../AGENTS.md)、[../../CLAUDE.md](../../CLAUDE.md)
- 行为规格:`shared-request` 能力,归档后位于 `openspec/specs/shared-request/spec.md`;索引见 [openspec/specs/](../../openspec/specs/)
- 消费方:前端(baseURL 传 `NEXT_PUBLIC_BFF_URL`);Node preset(BFF→backend)为规划扩展位
- Lint / 格式化:`pnpm --filter @workspace/request lint` / `format`;根配置 `.oxlintrc.json` / `.oxfmtrc.json`
- 项目工作流:`openspec/`(OpenSpec 2.0)

只放请求基础设施;单文件自包含、包内不写相对 import、不读环境变量;业务接口封装留在消费方。
