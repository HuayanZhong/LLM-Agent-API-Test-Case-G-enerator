# Tasks

## 1. 应用包文档

- [x] 1.1 为 `apps/frontend` 写 `README.md`：职责、Next 16 / React 19 / Tailwind v4、`dev` / `build` / `start` 与 3000、`src/app` 与 `src/components`、`components.json` 路由、`transpilePackages`、catalog 引用、相关文档链接；验证文件存在，且命令与 `apps/frontend/package.json` 一致。
- [x] 1.2 为 `apps/frontend` 写 `CLAUDE.md`：本包职责、命令与端口、目录入口、`shadcn add` 必须在 app 目录执行、UI 组件不放 app、系统字体、Next 托管 `AGENTS.md` 的注意事项、改动前链接、验证命令；验证章节齐全且命令可直接执行。
- [x] 1.3 为 `apps/frontend` 补 `AGENTS.md` 索引内容，放在现有 `<!-- BEGIN:nextjs-agent-rules -->` 标记上方；验证文件同时包含我们的索引标题与 Next 托管标记，且我们的内容不在标记内部。
- [x] 1.4 为 `apps/bff` 写 `README.md`、`CLAUDE.md`、`AGENTS.md`：4000、`GET /health`、NestJS 12 + ESM（`.js` 导入后缀、顶层 await）、`catalog:backend`、BFF 只做会话 / SSE / 聚合；验证三份文件存在，端口与 `src/main.ts` 一致。
- [x] 1.5 为 `apps/backend` 写 `README.md`、`CLAUDE.md`、`AGENTS.md`：5000、`GET /health`、领域服务定位、与 BFF 的边界、ESM 与 catalog 约束；验证三份文件存在，端口与 `src/main.ts` 一致。

## 2. 共享包文档

- [x] 2.1 为 `packages/ui` 写 `README.md`、`CLAUDE.md`、`AGENTS.md`：`@workspace/ui`、`exports` 路径、源码包不做 `dist`、`components.json` 与 alias、`globals.css` 的 `@source`、`catalog:frontend`、组件只能从 app 目录添加；验证三份文件存在，`exports` 与 `packages/ui/package.json` 一致。

## 3. 根文档索引

- [x] 3.1 在根 `README.md` 新增「包级文档」一节，链接四个包的三份文件；验证四条链接均指向存在的文件，并声明包 README 是本地事实的权威位置。
- [x] 3.2 在根 `CLAUDE.md` 的「仓库结构」后新增「包级文档」小节，说明进入包内工作时先读同目录 `CLAUDE.md`；验证小节存在且链接可达。
- [x] 3.3 在根 `AGENTS.md` 的索引里补上四个包的三份文件位置；验证索引条目与真实路径一致。

## 4. 规则与上下文

- [x] 4.1 更新 `.claude/rules/doc-sync.md`：在「必须同步的文件」表里增加包级 `README.md` / `CLAUDE.md` / `AGENTS.md`，并新增「包级文档」小节，写死三份文件的固定章节与最小要求；验证规则文件中的路径与模板字段可直接照抄。
- [x] 4.2 更新 `openspec/config.yaml` 的 `context`，记录包级文档约定；验证 `pnpm exec openspec validate --all` 退出 0。

## 5. 集成验证

- [x] 5.1 启动 `pnpm --filter frontend dev`，等 3000 就绪后读取 `apps/frontend/AGENTS.md`，验证我们的索引内容仍在、Next 托管块仍在且未被重复追加；随后关闭 dev 进程。
- [x] 5.2 检查 12 份新增/修改文档中的相对链接，验证每个链接目标文件都存在、锚点可定位。
- [x] 5.3 复核四包三份文件的数量与路径（`apps/frontend`、`apps/bff`、`apps/backend`、`packages/ui`），验证无缺失、无多余命名（大小写一致）。

## Workflow follow-up

- 完成 review 后用 `openspec-archive-change` 归档，并确认 `openspec list` 中无活跃变更。
