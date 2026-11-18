# Proposal: add-request-package

## Why

前端即将从"纯 UI 演示"进入对接 BFF 的阶段,但仓库还没有统一的请求基础设施。每个 feature 各自写 `fetch` 会导致 baseURL 来源、超时、错误处理、认证头注入各行其是,后续无法统一演进。项目技术栈已定 ky 作为 HTTP 客户端(后端执行层同样使用),需要一个共享包把 ky 封装成可复用的实例工厂,先交付"能用"的骨架,BFF→backend 的 Node 端复用同一核心。

## What Changes

- 新增 workspace 包 `@workspace/request`(`packages/request`),源码包模式(无构建,`exports` 指向 `./src/*.ts`),与 `@workspace/config` / `@workspace/ui` 同模式。
- 核心导出:环境无关的 ky 实例工厂 `createRequestClient(options)`,`baseURL` 由调用方传入,包内不读环境变量。
- 浏览器 preset:`createBrowserRequestClient(options)`,提供 JSON 头、默认超时等合理默认值;前端以 `process.env.NEXT_PUBLIC_BFF_URL` 作为 baseURL 调用。
- 错误处理不自定义 ApiError:re-export ky 2 的 `HTTPError` / `NetworkError` 类型,消费方 catch 这两种;`HTTPError.data` 已预解析错误体。
- `ky`(`^2.2.0`,零依赖,Node ≥ 22)加入 `pnpm-workspace.yaml`,新增 `shared` catalog 分类存放跨端运行时依赖。
- 包内 Vitest 测试覆盖工厂默认值与 preset 行为,接入根 `pnpm test` 的 95% 行覆盖率门槛。
- 按文档同步规则补齐包三份文档(README / CLAUDE / AGENTS)并更新根文档的包清单。

不做的事情(本期明确排除):

- 不实现具体业务接口调用(如 auth 登录请求),后续按模块演进。
- 不实现 Node preset(BFF→backend),只保留核心工厂的环境无关性作为扩展位。
- 不自定义业务错误码归一化层,直接暴露 ky 2 原生错误类型。
- 不改前端页面代码,前端消费由后续变更接入。

## Capabilities

### New Capabilities

- `shared-request`: 跨端 HTTP 请求基础设施的行为规格——实例工厂与浏览器 preset 的配置语义、baseURL 由调用方传入的约束、错误类型暴露、包的边界(不读环境变量、不含业务接口)。

### Modified Capabilities

(无——本变更只新增包,不改变既有能力的需求。)

## Impact

- **新增代码**:`packages/request/`(源码 + 测试 + 三份包级文档)。
- **依赖**:`pnpm-workspace.yaml` 新增 `shared` catalog 与 `ky: ^2.2.0`;`packages/request/package.json` 声明 `ky` 与共享工具链依赖。
- **工作区结构**:包数量从九个变十个,根 README / CLAUDE.md / AGENTS.md 的目录结构与包描述、`packages/request` 的 knip / sherif / turbo / changesets fixed 组覆盖需要确认(均为清单式更新)。
- **不影响**:既有九个包的运行时行为;`apps/frontend` 代码本期不改;`openspec/specs` 既有规格不变。
