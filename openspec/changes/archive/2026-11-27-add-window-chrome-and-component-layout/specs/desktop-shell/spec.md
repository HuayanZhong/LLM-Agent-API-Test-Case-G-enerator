# Spec Delta

## Purpose

桌面壳新增自定义窗口头部：Windows 上使用窗口控件覆盖层保留系统窗口按钮，标题栏背景透明融入页面，系统按钮符号色随应用主题同步；同时修正窗口最小尺寸规格与实现不一致。

## MODIFIED Requirements

### Requirement: 渲染进程安全隔离

渲染进程 SHALL 在 sandbox 与 contextIsolation 开启、nodeIntegration 关闭的配置下运行；preload MUST 只暴露显式定义的最小 API（平台与版本信息，以及一个只接受 `light` / `dark` 的标题栏主题同步方法），渲染进程 MUST NOT 直接访问 Node.js 或 Electron 主进程能力，也 MUST NOT 通过该接口传入任意颜色、尺寸、路径或其他原生窗口配置。

#### Scenario: 渲染进程没有 Node 能力

- **WHEN** 渲染进程尝试访问 `require`、`process` 或 Node 核心模块
- **THEN** 这些能力不可用，页面只能通过 preload 暴露的 API 与桌面壳交互

#### Scenario: preload 暴露最小接口

- **WHEN** 页面读取桌面壳注入的全局对象
- **THEN** 只能看到 `platform`、`versions` 与 `setTitleBarTheme`，看不到任意 IPC 或文件系统入口

#### Scenario: 非法主题参数被忽略

- **WHEN** 渲染进程向标题栏主题通道发送 `light` / `dark` 之外的值
- **THEN** 主进程忽略该消息，窗口标题栏保持原配色

### Requirement: 主窗口尺寸约束

桌面壳 SHALL 以 1280×800 作为主窗口初始尺寸，并 MUST 限制窗口不能被缩到小于 800×600，避免前端内容被压缩到不可操作。

#### Scenario: 默认尺寸启动

- **WHEN** 应用启动并创建主窗口
- **THEN** 主窗口初始宽度为 1280、高度为 800

#### Scenario: 缩放到最小尺寸

- **WHEN** 用户持续拖动窗口边缘缩小主窗口
- **THEN** 窗口宽度不小于 800、高度不小于 600

## ADDED Requirements

### Requirement: 窗口控件覆盖层与自定义标题栏

Windows 平台上的桌面壳 SHALL 隐藏原生标题栏并使用窗口控件覆盖层：保留系统最小化、最大化与关闭按钮，MUST NOT 显示标题文字或产品图标；覆盖层背景 MUST 透明，使页面背景直接透出；系统按钮符号色 MUST 跟随应用深浅色主题；覆盖层高度 MUST 与前端标题栏高度一致；标题栏区域 MUST 支持拖动窗口与双击最大化。非 Windows 平台 MUST 保持平台默认窗口头部。

#### Scenario: 启动后没有标题文字与图标

- **WHEN** Windows 应用启动并显示主窗口
- **THEN** 窗口顶部不出现原生标题文字或产品图标，只有系统最小化、最大化与关闭按钮

#### Scenario: 系统窗口按钮可用

- **WHEN** 用户点击最小化、最大化或关闭按钮
- **THEN** 窗口按系统行为最小化、最大化/还原或关闭

#### Scenario: 拖动与双击最大化

- **WHEN** 用户在标题栏空白区域拖动，或双击该区域
- **THEN** 窗口跟随移动，双击时在最大化与还原之间切换

#### Scenario: 页面背景透出

- **WHEN** 主窗口显示认证页的双栏布局
- **THEN** 标题栏区域同时透出左侧品牌栏与右侧表单栏的背景，不出现横向接缝或独立底色

#### Scenario: 主题切换同步按钮符号色

- **WHEN** 用户在应用内切换浅色与深色主题
- **THEN** 系统按钮符号色随主题在深浅之间切换，保持可辨识

#### Scenario: 非 Windows 保持默认头部

- **WHEN** 应用运行在非 Windows 平台
- **THEN** 窗口使用该平台默认头部，不启用覆盖层，页面功能不受影响
