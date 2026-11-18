# shared-request Specification

## Purpose

为前端(后续含 BFF→backend)提供统一的 HTTP 请求基础设施:以 ky 实例工厂为核心,收敛 baseURL、默认配置与错误类型的语义,避免各 feature 自行封装 `fetch` 导致行为分叉。

## Requirements

### Requirement: 实例工厂接收调用方传入的 baseURL

请求包 SHALL 提供环境无关的实例工厂,工厂 MUST 以调用方传入的 `baseURL` 作为请求地址前缀;`baseURL` 缺失、空字符串或非法 URL 时,工厂 MUST 在创建阶段即抛出错误,不允许延迟到首次请求才失败。工厂 MUST NOT 自行读取环境变量或加载 `.env` 文件。

#### Scenario: 传入合法 baseURL 创建实例

- **WHEN** 调用方以 `{ baseURL: "http://localhost:4000" }` 调用工厂
- **THEN** 返回一个实例,其后发起的请求均以该 baseURL 为地址前缀

#### Scenario: baseURL 缺失时创建即失败

- **WHEN** 调用方未传 `baseURL` 或传入空字符串、非法 URL
- **THEN** 工厂调用立即抛出错误,且错误信息说明 baseURL 校验失败

#### Scenario: 不读取环境变量

- **WHEN** 运行环境中不存在任何 `NEXT_PUBLIC_*` 或其他环境变量,但调用方显式传入了合法 `baseURL`
- **THEN** 工厂仍正常返回实例并发起请求,行为与有环境变量时完全一致

### Requirement: 浏览器 preset 提供可用默认值

请求包 SHALL 提供浏览器 preset 工厂,在实例工厂之上预置浏览器端默认配置:JSON 请求头与有限超时;调用方显式传入的选项 MUST 能覆盖 preset 默认值。

#### Scenario: preset 默认发送 JSON 请求

- **WHEN** 通过浏览器 preset 实例发起带 JSON body 的请求
- **THEN** 请求携带 JSON Content-Type,无需调用方手动设置请求头

#### Scenario: 调用方选项覆盖 preset 默认

- **WHEN** 调用方通过浏览器 preset 显式传入超时时长
- **THEN** 实际生效的是调用方传入的值,而非 preset 默认值

#### Scenario: 请求超过超时上限

- **WHEN** 服务端在超时时长内未返回响应
- **THEN** 请求以超时错误失败,错误类型可被消费方区分于其他失败

### Requirement: 错误类型开箱可辨

请求包 SHALL re-export 底层 HTTP 客户端的错误类型,使消费方无需了解底层实现即可按错误种类处理:HTTP 错误状态(4xx / 5xx)与非 HTTP 错误(网络失败、超时)MUST 是可区分的不同错误类型;HTTP 错误 MUST 携带状态码与已解析的错误响应体,消费方 MUST NOT 需要自行二次解析响应体。

#### Scenario: 服务端返回错误状态码

- **WHEN** 服务端对请求返回 4xx 或 5xx 状态码及 JSON 错误体
- **THEN** 请求抛出 HTTP 错误类型,其上可直接读取状态码与解析后的错误体字段

#### Scenario: 网络层失败与 HTTP 错误可区分

- **WHEN** 请求因连接拒绝等网络层原因失败
- **THEN** 抛出的错误类型与 HTTP 错误状态码场景的类型不同,消费方可用同一 catch 分流

### Requirement: 包只做基础设施不含业务接口

请求包的公开导出 MUST 只包含实例工厂、preset 与错误类型;MUST NOT 包含任何具体业务端点的请求函数(如登录、项目、用例等),业务接口的封装留在消费方或后续按模块演进。包 SHALL 以源码形式发布使用(无构建产物),与仓库内其他运行时共享包保持一致。

#### Scenario: 公开导出范围可枚举

- **WHEN** 审查包的公开导出清单
- **THEN** 仅存在实例工厂、浏览器 preset 与错误类型三类导出,不含任何业务端点函数
