# Tasks

## 1. 工作区与依赖脚手架

- [x] 1.1 `pnpm-workspace.yaml` 新增 `shared` catalog 分类与 `ky: ^2.2.0`;`packages/request/package.json` 以 `catalog:shared` 引用 ky,`engines`、`exports`、scripts 照 `packages/config` 模式填写;执行 `pnpm install` 验证安装成功且 `node -e "import('ky').then(k => console.log(typeof k.default.create))"` 输出 `function`
- [x] 1.2 创建 `packages/request/tsconfig.json`、`vitest.config.ts`(继承共享 profile)与 oxlint / oxfmt 可扫的最小目录(`src/`);`pnpm --filter @workspace/request check-types` 退出码 0

## 2. 核心工厂(实例工厂)

- [x] 2.1 实现 `src/create-request-client.ts`:baseURL 必填并在创建阶段校验(缺失、空串、非法 URL 即抛错),选项透传 `ky.create`,工厂不读环境变量;对应测试:合法 baseURL 返回实例且请求以 baseURL 为前缀、非法输入创建即抛错、无环境变量时行为不变(fetch stub 记录请求 URL),`pnpm --filter @workspace/request test` 退出码 0 且行覆盖率 ≥ 95%
- [x] 2.2 从入口 re-export ky 2 的 `HTTPError` / `NetworkError` / `TimeoutError` 类型;对应测试:服务端返回 4xx + JSON 错误体时抛 `HTTPError` 且 `error.data` 已解析、连接拒绝时抛 `NetworkError` 与 HTTP 错误类型可区分,`pnpm --filter @workspace/request test` 通过

## 3. 浏览器 preset

- [x] 3.1 实现 `src/presets/browser.ts` 的 `createBrowserRequestClient`:预置 JSON Content-Type、默认 `timeout`(10s),调用方显式选项覆盖默认;对应测试:JSON body 请求自带 JSON 头、显式超时覆盖默认、超时抛 `TimeoutError` 可被 `instanceof` 分流,`pnpm --filter @workspace/request test` 通过
- [x] 3.2 入口 `src/index.ts` 汇出工厂、preset 与错误类型,确认公开导出仅此三类(无业务端点函数);`node --input-type=module -e "import('@workspace/request').then(m => console.log(Object.keys(m)))"` 的输出与设计清单一致

## 4. 包级文档

- [x] 4.1 编写 `packages/request/README.md`(职责 / 用法示例 / 目录 / 依赖与边界 / 相关文档)、`CLAUDE.md`(本包职责 / 命令 / 目录入口 / 约束与坑 / 改动前读什么 / 验证)、`AGENTS.md`(8–12 行索引);README 中的用法示例代码逐字可运行;确认三份文件相对链接可达

## 5. 文档同步与全量门禁

- [x] 5.1 更新根 `README.md`、`CLAUDE.md`、`AGENTS.md` 的包清单与仓库结构(九包 → 十包),`pnpm-workspace.yaml` catalog 注释同步 `shared` 分类说明;核对 `doc/README.md` 无需变更并记录理由;`pnpm exec openspec validate --all` 退出码 0
- [x] 5.2 全量验证:`pnpm check-types`、`pnpm test`(新包计入 95% 行覆盖率门槛)、`pnpm lint`、`pnpm format`、`pnpm sherif`、`pnpm knip` 全部退出码 0;`pnpm changeset:status` 正常且新包在 fixed 组内随版本发布

## Workflow follow-up

- 功能 PR 附 changeset(`pnpm changeset`),合并 main 后由 release workflow 走 Version Packages PR。
- 归档前跑 `pnpm exec openspec validate --all`;人工确认验收后用 `openspec-archive-change` 归档,归档后确认 `openspec/specs/shared-request/spec.md` 生成。
