# @workspace/request

跨端共享的 HTTP 请求基础设施,基于 ky 2 封装。源码包、无构建;只做「实例工厂 + preset + 错误类型」,不做业务接口。

## 职责

统一 baseURL 注入、默认配置与错误类型,让前端消费 BFF 时用同一套请求语义,避免各 feature 自行封装 `fetch` 导致行为分叉。核心工厂环境无关,BFF→backend 的 Node preset 后续按需另起文件复用同一核心。

## 运行

本包没有 `dev` / `build` 脚本;有 `check-types`、`test`、`test:watch`、`lint`、`format`。

```bash
pnpm --filter @workspace/request check-types
pnpm --filter @workspace/request test      # vitest run --coverage,行覆盖率 ≥ 95%
pnpm --filter @workspace/request lint      # oxlint .,根配置
pnpm --filter @workspace/request format    # oxfmt --check .,根配置
```

消费方在 `dependencies` 声明(本包是运行时依赖,不是纯类型包):

```json
"@workspace/request": "workspace:*"
```

## 目录

```text
packages/request/
├── src/request-client.ts          # 自包含单文件:assertBaseUrl + createRequestClient
│                                  #   + createBrowserRequestClient + 错误 re-export
├── __tests__/
│   ├── create-request-client.test.ts
│   └── browser-preset.test.ts
├── package.json                   # exports 指向 ./src/request-client.ts;dependencies: ky
├── tsconfig.json                  # 继承 @workspace/typescript-config/base.json
├── vitest.config.ts               # 继承 @workspace/vitest-config/base
├── README.md
├── CLAUDE.md
└── AGENTS.md
```

## 用法

前端创建实例(baseURL 用 `NEXT_PUBLIC_BFF_URL` 字面量引用,由 Next 内联):

```ts
import { createBrowserRequestClient } from "@workspace/request"

export const api = createBrowserRequestClient({
  baseURL: process.env.NEXT_PUBLIC_BFF_URL!,
})
```

发请求与分流错误:

```ts
import { HTTPError, NetworkError, TimeoutError } from "@workspace/request"

try {
  const user = await api.post("auth/login", { json: { email, password } }).json<{ token: string }>()
} catch (error) {
  if (error instanceof HTTPError) {
    // error.data 已预解析错误体,不需要自行 response.json()
    console.error(error.response.status, error.data)
  } else if (error instanceof NetworkError) {
    // 网络层失败(DNS、连接拒绝、断网)
  } else if (error instanceof TimeoutError) {
    // 超过 timeout(preset 默认 10s)
  }
}
```

公开导出仅三类:实例工厂(`createRequestClient`)、浏览器 preset(`createBrowserRequestClient`)、错误类型(`HTTPError` / `NetworkError` / `TimeoutError`)。不含任何业务端点函数。

## 依赖与边界

- 运行时依赖只有 `ky`(`catalog:shared`,跨端运行时依赖分类,backend 执行层规划同用)。
- 包内**不写相对 import**:本包由 Node 直接加载 `.ts` 源码,无扩展名说明符解析不到 `.ts`,显式 `.ts` 扩展名又会被未开 `allowImportingTsExtensions` 的消费方 tsc 拒绝。因此单文件自包含;新增域(Node preset 等)另起文件并在 `exports` 暴露。
- **不读环境变量、不加载 `.env`**:`NEXT_PUBLIC_*` 必须在前端代码里以字面量引用才会被 Next 内联,包里读 `process.env` 拿到的是 `undefined`;baseURL 一律由调用方传入,创建阶段校验,失败即抛 `TypeError`。
- baseURL 用 ky 的 `prefix`(拼接语义)而非 `baseUrl`(标准 URL 解析):baseURL 带路径段(如 `/api/v1`)时,以 `/` 开头的相对路径不会被剥掉已有路径。
- 自定义 ApiError / 错误码归一化留到 BFF 定义业务错误契约后再做;当前直接暴露 ky 2 原生错误。
- ky 2 的 `.json()` 对 204 / 空响应体抛错;业务侧遇到空响应端点时先判 `res.status`。

## 相关文档

- 根入口:[../../README.md](../../README.md)、[../../CLAUDE.md](../../CLAUDE.md)、[../../AGENTS.md](../../AGENTS.md)
- 行为规格:`shared-request` 能力,归档后位于 `openspec/specs/shared-request/spec.md`;索引见 [openspec/specs/](../../openspec/specs/)
- 同类源码包约束:[../config/CLAUDE.md](../config/CLAUDE.md)
- 文档同步规则:[../../.claude/rules/doc-sync.md](../../.claude/rules/doc-sync.md)
