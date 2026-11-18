# CLAUDE.md

本文件是 `packages/request` 的包级规则。项目级规则见 [../../CLAUDE.md](../../CLAUDE.md)。

## 本包职责

`@workspace/request`:跨端共享的 HTTP 请求基础设施(ky 2 实例工厂与浏览器 preset)。只有运行时基础设施,没有 dev / build 脚本、没有进程与端口;不含任何业务端点函数。

## 命令与端口

- 无端口、无 `dev` / `build` 脚本。
- `pnpm --filter @workspace/request check-types` 做本包类型检查。
- `pnpm --filter @workspace/request test`(行覆盖率 ≥ 95%)与 `test:watch`。
- `pnpm --filter @workspace/request lint` / `format`,配置用根 `.oxlintrc.json` / `.oxfmtrc.json`。

## 目录与入口

- `src/request-client.ts`:自包含单文件——`assertBaseUrl`、`createRequestClient`、`createBrowserRequestClient` 与 ky 错误类的 re-export;当前唯一的域。
- `package.json` 的 `exports` 指向 `./src/request-client.ts`;新增域(Node preset 等)另起自包含文件并加子路径导出。
- 消费方用 `import { createBrowserRequestClient, HTTPError } from "@workspace/request"`;baseURL 由调用方传入。

## 本包约束

- 本包是运行时依赖,消费方必须放在 `dependencies`,不是 `devDependencies`。
- 包内不写相对 import:Node 直接加载 `.ts` 源码时无扩展名说明符解析不到 `.ts`;写显式 `.ts` 扩展名会让未开 `allowImportingTsExtensions` 的消费方 tsc 报 TS5097。一个域一个自包含文件。
- 只写 Node 类型剥离支持的语法;不要用 `enum`、`namespace` 或参数属性。
- 不读 `process.env`、不加载 `.env`;`NEXT_PUBLIC_*` 必须在前端代码里字面量引用才会被 Next 内联,包里读必拿 `undefined`。
- baseURL 用 ky 的 `prefix`(拼接语义),不要改回 `baseUrl`(标准 URL 解析会剥掉 baseURL 的路径段)。
- 不放业务接口封装、错误码归一化层或 app 专属配置;等 BFF 定义业务错误契约后再演进。
- `ky` 版本走 `catalog:shared`,升级只改 `pnpm-workspace.yaml`;ky 2 与 1.x 差异大(hooks 统一 state、`prefixUrl`→`prefix`、`.json()` 对空响应抛错),不要按 1.x 资料写代码。

## 改动前读什么

- 行为规格:`shared-request` 能力,归档后位于 `openspec/specs/shared-request/spec.md`;索引见 [openspec/specs/](../../openspec/specs/)
- 同类源码包约束:[../config/CLAUDE.md](../config/CLAUDE.md)
- 文档同步规则:[../../.claude/rules/doc-sync.md](../../.claude/rules/doc-sync.md)
- 注释规则:[../../.claude/rules/code-comments.md](../../.claude/rules/code-comments.md)

## 验证

- `pnpm --filter @workspace/request check-types`、`test`、`lint`、`format` 退出码 0。
- 改导出后用 Node 直接 import 一次本包,确认类型剥离能加载:`node --input-type=module -e "import('@workspace/request').then(m => console.log(Object.keys(m)))"`。
- 公开导出应只有实例工厂、浏览器 preset 与错误类型三类;出现业务端点函数即为越界。
