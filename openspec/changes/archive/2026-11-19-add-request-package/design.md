# Design: add-request-package

## Context

仓库是 pnpm monorepo,共享包有两种形态:`packages/ui`、`packages/config` 是源码包(无构建,`exports` 指向 `./src/*.ts`),`packages/typescript-config` 是纯配置。前端是 Next.js 静态导出,所有请求发生在浏览器;BFF→backend 是未来的 Node 端场景。ky 尚未进入任何依赖清单。`NEXT_PUBLIC_BFF_URL` 已在根 `.env.example` 声明,实际值放 `apps/frontend/.env.*`,由 Next 原生加载并内联。

其他约束:

- `NEXT_PUBLIC_*` 变量必须在前端代码中以 `process.env.NEXT_PUBLIC_X` 字面量引用才会被 Next 内联;共享包里读 `process.env` 在打包后拿到的是 `undefined`。
- `packages/config` 的既定约束是"只解析不加载,env 由调用方传入";请求包沿用同一哲学。
- pnpm `nodeLinker: hoisted`、Changesets fixed 组统一版本、knip / sherif 全包扫描——新包必须满足这些门禁。

## Goals / Non-Goals

**Goals:**

- 交付一个"能用"的最小骨架:导入 → 传 baseURL → 发请求 → catch 错误,四步走通。
- 核心环境无关,浏览器 preset 落地,Node preset 只留扩展位。
- 与既有包的模式、门禁(knip / sherif / 覆盖率)完全对齐,不为它开特例。

**Non-Goals:**

- 不做业务接口层与错误码归一化(见 proposal「不做的事情」)。
- 不做请求/响应拦截的通用插件系统——hooks 参数透传给 ky 即可,不自建抽象。
- 不动前端页面代码,不做前端消费接入(后续变更)。

## Decisions

### D1:源码包,无构建

`exports` 指向 `./src/*.ts`,照 `@workspace/config` 模式。前端经 Next 打包消费,Node 端经 Node 26 类型剥离消费,一套源码两端可用。备选的 dist 构建包只对被构建链消费的包有意义,这里徒增 `build` 任务与缓存配置。

注意:`@workspace/config` 包内禁相对 import 的约束(Node 直接加载 `.ts`)同样适用本包的 Node 端路径,且适用范围比最初评估的更宽——不仅 exports 子路径,包内任何跨文件相对 import 都过不去:无扩展名说明符 Node 解析不到 `.ts`,显式 `.ts` 扩展名又会被未开 `allowImportingTsExtensions` 的消费方 tsc(如 frontend 的 nextjs profile)拒绝。因此实现收敛为单文件自包含(`src/request-client.ts`,工厂 + preset + re-export),与 config / vitest-config 的"一个域一个自包含文件"约定一致;新增域(Node preset 等)另起自包含文件并在 `package.json` exports 暴露。

### D2:baseURL 由调用方传入,包不读环境变量

工厂签名 `createRequestClient({ baseURL, ... })`,`baseURL` 必填并在创建阶段校验(zod 或手写,倾向手写——校验逻辑一句话,引入 zod 依赖违反最小骨架)。前端用法:

```ts
import { createBrowserRequestClient } from "@workspace/request"

export const api = createBrowserRequestClient({
  baseURL: process.env.NEXT_PUBLIC_BFF_URL!,
})
```

理由:`NEXT_PUBLIC_*` 内联机制要求字面量引用,包里读必拿 `undefined`;同时让包与 `@workspace/config` 的"不读 env"边界一致。备选"包内读 `NEXT_PUBLIC_BFF_URL`"被否——静默产出指向 `undefined` 的实例,比创建即失败更难排查。

### D3:ky 2.2 + 新增 `shared` catalog

`ky@^2.2.0`(零依赖,Node ≥ 22,browser/Node 通用)进 `pnpm-workspace.yaml`,新增 `shared` 分类:ky 是跨端运行时依赖(frontend 现在用、backend 执行层规划用),放 `frontend` catalog 会让 BFF 引用 `catalog:frontend`,语义错位。备选"放 tooling"被否——tooling 是工具链,ky 是运行时依赖,sherif 会按依赖类型区分。

实现上用 `ky.create()`,不手写 fetch 包装。

### D4:不自定义 ApiError,re-export ky 2 原生错误类型

ky 2 已提供 `HTTPError`(预解析 `error.data`)与 `NetworkError`(网络层失败),超时为 `TimeoutError`。骨架期 re-export 这三者;消费方 `catch` 后按 `instanceof` 分流。自建归一化层留到业务错误码(BFF 真正定义错误契约)出现时再做——现在做必然猜测错误结构,返工概率高。

### D5:浏览器 preset 只预置最小默认

默认值收敛为:JSON Content-Type、`timeout`(默认 10s)、`retry`(ky 2 默认已只对真实网络错误重试,保留默认)。超时上限用 ky 2 的 `timeout` + `totalTimeout` 组合中的 `timeout` 即可,骨架期不加总超时配置项。调用方选项浅合并覆盖默认,由 `ky.create` 的选项合并语义保证。

### D6:测试用 fetch stub,不引 mock 库

Vitest + 手写 `globalThis.fetch` stub(记录调用参数、返回构造的 Response)。备选 msw 被否——骨架期只有 4 个左右的测试点,引一个库+server 生命周期管理不成比例。测试环境用 vitest-config 的 base profile(Node 环境,fetch 为 Node 26 原生实现,stub 方式与浏览器一致)。

## Risks / Trade-offs

- [ky 2 `.json()` 对 204/空响应体抛错] → preset 不在 `parseJson` 上做额外封装;文档写明该行为,业务侧遇到空响应端点时用 `res.status` 判断。等真实接口出现再决定是否包一层。
- [ky 2.2 是 2026 年的大版本重写,生态资料仍以 1.x 居多] → 锁定 `^2.2.0` 单一版本入口(catalog),坑只在包内踩一次;README 写明 2.x 与 1.x 的关键差异点。
- [骨架过薄,前端接入时发现缺认证钩子/错误码] → 工厂透传 ky hooks 选项,前端可自带 `beforeRequest` 注入认证头,不需要等包升级;这是把"薄"变成演进空间而非障碍的关键。
- [新增 catalog 触发 sherif / knip 门禁] → 任务里显式包含 `pnpm sherif` 与 `pnpm knip` 验证步骤,清单式修复。
- [Changesets fixed 组按目录扫描] → 新包自动进组,`privatePackages.version: true` 已覆盖私有包,无需配置改动;任务里验证 `pnpm changeset:status`。

## Migration Plan

纯新增,无迁移。回滚 = 删除 `packages/request/` + 还原 `pnpm-workspace.yaml` 的 catalog 条目 + 还原根文档清单,无任何消费方受影响。

## Open Questions

无——d2 的 baseURL 注入方式、d3 的 catalog 归属、d4 的错误策略均已在提案阶段与用户确认。
