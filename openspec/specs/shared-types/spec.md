# shared-types Specification

## Purpose

为 workspace 提供唯一的跨应用类型入口，使前端、桌面壳与 Nest 服务共享同一份跨进程契约，同时把控制器入参与各应用内部类型挡在包外。

## Requirements

### Requirement: 共享类型包的单一入口

仓库 SHALL 提供一个私有共享类型包 `@workspace/types`，`apps/` 下的应用都可以通过类型导入引用跨进程契约；该包 MUST 只包含 TypeScript 类型声明，不产生运行时产物。

#### Scenario: 应用可以引用共享类型

- **WHEN** 任一应用以 `import type` 从 `@workspace/types` 引用一个已导出的类型
- **THEN** `pnpm check-types` 通过，且该应用无需直接依赖另一个应用

#### Scenario: 共享类型不进入运行时产物

- **WHEN** 构建 `frontend`、`bff`、`backend` 或 `desktop`
- **THEN** 构建产物中不存在对 `@workspace/types` 的运行时导入，类型在编译期被完全擦除

#### Scenario: 包内没有运行时值

- **WHEN** 检查共享类型包的源码与依赖
- **THEN** 只有类型导出，没有常量、函数、类或第三方运行时依赖

### Requirement: 共享类型的内容边界

共享包 SHALL 只承载跨进程、被另一个应用消费的只读数据形状，例如 HTTP 响应体、SSE 事件与 preload 暴露的桥接对象；MUST NOT 包含 controller 入参 DTO、装饰器类、校验规则、Electron 主进程内部契约或框架类型。

#### Scenario: 控制器返回只读形状

- **WHEN** Nest 控制器声明一个跨应用消费的响应体
- **THEN** 返回类型可以引用共享包中的形状，值仍在应用内构造

#### Scenario: 控制器入参留在应用内

- **WHEN** 新增或修改 controller 的请求参数
- **THEN** DTO 类与其校验装饰器定义在应用内，不从共享包导入，也不在共享包中镜像字段

#### Scenario: 桌面壳内部契约不被搬出

- **WHEN** 检查桌面壳的窗口、协议、测试注入等主进程内部类型
- **THEN** 它们仍位于 `apps/desktop`，共享包中只有渲染进程可见的桥接对象

### Requirement: 消费方只做类型导入

共享类型的消费方 SHALL 使用 `import type`，MUST NOT 以值导入方式引用该包；运行时行为仍由各应用自己实现。

#### Scenario: 类型导入与值导入

- **WHEN** 应用需要共享包中的类型
- **THEN** 代码使用 `import type`，构建产物中没有该包的运行时引用

#### Scenario: preload 与渲染进程共用桥接契约

- **WHEN** 桌面壳的 preload 暴露桥接对象，渲染进程读取同一对象
- **THEN** 生产方与消费方引用同一个共享类型，平台字段不依赖 Node 类型命名空间
