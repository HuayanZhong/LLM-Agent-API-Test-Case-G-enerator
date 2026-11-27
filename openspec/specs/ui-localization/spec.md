# ui-localization Specification

## Purpose

为静态导出的桌面工作台提供中英双语界面：统一文案目录、默认语言、语言切换与偏好持久化，使用户可见文案不再散落在组件中。

## Requirements

### Requirement: 语言目录与默认语言

系统 SHALL 提供 zh-CN 与 en-US 两套界面文案；zh-CN MUST 为默认语言；所有用户可见文案 MUST 来自文案目录，不得硬编码在组件中；en-US MUST 覆盖 zh-CN 的全部键。

#### Scenario: 默认中文界面

- **WHEN** 用户首次进入且本地没有语言偏好
- **THEN** 界面以中文呈现，且 `<html lang>` 为 `zh-CN`

#### Scenario: 英文词表完整

- **WHEN** en-US 缺少 zh-CN 存在的键，或键值不符合类型
- **THEN** 类型检查或测试失败，构建不得通过

#### Scenario: 英文界面无中文残留

- **WHEN** 用户切换到 en-US 并浏览登录页与注册页
- **THEN** 除产品专有名词外，所有界面文案均以英文呈现

### Requirement: 语言选择与持久化

系统 SHALL 在全局窗口标题栏右侧提供语言切换入口，与主题入口并列并位于系统窗口按钮左侧；浏览器预览（无桌面壳）时入口位于视口右上角区域。选择 MUST 立即生效且不改变当前 URL；偏好 MUST 持久化到本地存储，重新加载后恢复；无偏好时 MUST 回落到 zh-CN；系统 MUST NOT 自动探测浏览器语言。

#### Scenario: 切换到英文

- **WHEN** 用户在中文界面点击英文选项
- **THEN** 当前页面立即切换为英文，URL 保持不变

#### Scenario: 刷新后保持选择

- **WHEN** 用户选择英文后刷新页面或重新打开桌面窗口
- **THEN** 界面仍为英文

#### Scenario: 清除偏好后回落

- **WHEN** 本地存储中没有语言偏好
- **THEN** 界面以中文呈现

#### Scenario: 桌面端同样生效

- **WHEN** Electron 生产包通过 `app://` 加载页面并切换语言
- **THEN** 切换与持久化行为与开发态一致，不依赖 Next 服务端进程

#### Scenario: 全局标题栏入口

- **WHEN** 用户在桌面壳中查看任意页面
- **THEN** 语言入口位于窗口标题栏，与主题入口并列，且不被系统窗口按钮遮挡

#### Scenario: 浏览器预览可用

- **WHEN** 前端在浏览器中运行且没有桌面壳
- **THEN** 语言入口仍位于视口右上角区域，可切换并持久化，不调用桌面接口

### Requirement: 文档语言同步

系统 SHALL 在语言变化后同步 `<html lang>` 为对应的 BCP 47 标签，并使页面标题跟随当前语言；静态导出产物中的初始标题仍以 zh-CN 生成。

#### Scenario: 切换后更新文档语言

- **WHEN** 用户把界面切换为英文
- **THEN** `<html lang>` 变为 `en-US`，浏览器标签或桌面窗口标题使用英文标题

### Requirement: 静态导出与桌面路径兼容

该能力 MUST 在 `output: "export"` 下工作，不得依赖 middleware、proxy、服务端 cookie 或 `[locale]` 路由；构建产物路径与 Electron `app://` 入口 MUST 保持现状。

#### Scenario: 静态构建

- **WHEN** 执行前端静态导出构建
- **THEN** `out/login/index.html`、`out/register/index.html` 等现有路径继续生成，且构建过程不要求服务端进程

#### Scenario: 桌面入口不变

- **WHEN** Electron 通过 `app://bundle/` 打开应用
- **THEN** 页面按默认语言或已保存偏好渲染，路径与现有协议处理一致

### Requirement: 切换组件可访问性

语言切换入口 SHALL 暴露可读名称与当前选中语言，MUST 可用键盘操作；入口 MUST 位于全局窗口标题栏，与主题入口并列且不被系统窗口按钮遮挡；语言数量增加时入口 MUST 可直接扩展，不要求重排标题栏布局。

#### Scenario: 键盘与读屏可用

- **WHEN** 用户用键盘聚焦语言切换入口并操作
- **THEN** 可切换语言，且读屏能读出入口名称与当前语言

#### Scenario: 与主题入口并列

- **WHEN** 页面在桌面宽度渲染
- **THEN** 语言入口与主题入口同时可见、互不遮挡，且均位于系统窗口按钮左侧
