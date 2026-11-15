# shared-config Specification

## Purpose

为各应用提供同一套环境变量解析与校验规则，使非法配置在启动时立刻失败并指出字段，而不是在运行中静默降级。

## Requirements

### Requirement: 环境变量解析入口

共享配置包 SHALL 提供 `parseEnv`，接收 schema、环境变量对象与可选标签，返回与 schema 对应的类型安全配置；校验失败时 MUST 抛出 `EnvError`，其 `issues` 包含每个失败字段的路径与原因。

#### Scenario: 合法环境变量

- **WHEN** 调用方传入满足 schema 的环境变量
- **THEN** `parseEnv` 返回类型安全的配置对象，数字型字段已完成从字符串到 number 的转换

#### Scenario: 非法环境变量

- **WHEN** 调用方传入不满足 schema 的环境变量
- **THEN** `parseEnv` 抛出 `EnvError`，`issues` 中能定位到每个失败字段的路径与原因，进程不会继续启动

#### Scenario: 错误信息带标签

- **WHEN** 调用方传入 `{ label: "backend" }`
- **THEN** `EnvError` 的 message 中包含该标签，便于区分多个应用的环境错误

### Requirement: 工厂函数的校验语义

共享配置包 SHALL 提供字符串、可选字符串、URL、正整数、非负整数与布尔字面量六类工厂；每类工厂 MUST 拒绝不符合语义的输入，MUST NOT 通过宽松 coercion 静默纠正。

#### Scenario: 数字字符串转换

- **WHEN** 正整数工厂收到 `"3000"`
- **THEN** 返回 `3000`；收到 `"abc"`、`"1.5"`、`"-1"` 或空字符串时校验失败

#### Scenario: 布尔字面量不静默翻转

- **WHEN** 布尔工厂收到 `"true"` / `"1"` / `"false"` / `"0"`
- **THEN** 分别返回 `true` / `true` / `false` / `false`
- **WHEN** 收到 `"yes"`、`""` 或 `"false "` 等其余值
- **THEN** 校验失败，不会出现 `Boolean("false") === true` 式的静默翻转

#### Scenario: URL 与必填字符串

- **WHEN** URL 工厂收到合法绝对地址
- **THEN** 原样返回；收到非 URL 字符串时校验失败
- **WHEN** 必填字符串工厂收到空字符串或缺失值
- **THEN** 校验失败

### Requirement: 应用启动时校验环境变量

`apps/backend` 与 `apps/bff` SHALL 在各自包内定义环境变量 schema，并在启动时解析 `process.env`；非法值 MUST 中止启动，缺失值 MUST 落到默认端口（5000 / 4000）。schema MUST NOT 放进共享配置包。

#### Scenario: 缺省端口

- **WHEN** 启动 backend 或 bff 且未设置对应端口变量
- **THEN** 分别使用 5000 与 4000 启动

#### Scenario: 非法端口中止启动

- **WHEN** 设置 `BACKEND_PORT=abc` 或 `BFF_PORT=`（空字符串）后启动对应服务
- **THEN** 进程以 `EnvError` 中止，错误中能看到字段名，服务不会监听任何端口

#### Scenario: 各应用持有自己的 schema

- **WHEN** 检查共享配置包与两个 Nest 应用的源码
- **THEN** 共享包只有通用解析与工厂函数，端口变量名只出现在各自的 `src/config.ts`
