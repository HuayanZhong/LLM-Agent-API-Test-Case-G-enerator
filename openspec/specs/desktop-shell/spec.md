# desktop-shell Specification

## Purpose

为 Next.js 前端提供 Electron 桌面壳，负责开发态与生产态的加载方式、渲染进程安全边界，以及可离线运行的桌面打包产物。

## Requirements

### Requirement: 开发态加载 Next 开发服务器

未打包运行时，桌面壳 SHALL 加载可配置的前端开发服务器地址，默认 `http://localhost:3000`；开发服务器未就绪时 MUST 在限定时间内重试，超时后展示可诊断的错误，而不是空白窗口。

#### Scenario: 开发服务器就绪后显示页面

- **WHEN** 应用以未打包模式启动，且 `http://localhost:3000` 可访问
- **THEN** 主窗口加载该地址并显示前端页面

#### Scenario: 开发服务器启动较慢

- **WHEN** 应用启动时前端开发服务器尚未监听，但在限定时间内变为可访问
- **THEN** 桌面壳继续重试并在服务器就绪后加载页面，不因首次失败退出

#### Scenario: 开发服务器不可用

- **WHEN** 应用在限定时间内始终无法连接开发服务器
- **THEN** 窗口展示包含目标地址与重试状态的错误信息，并允许用户重试

### Requirement: 生产态托管静态导出

打包运行时，桌面壳 SHALL 通过 `app://` 自定义协议提供 Next 静态导出产物，MUST NOT 启动 Next 服务器进程；根相对资源路径、嵌套路由与 404 页面都必须可用。

#### Scenario: 根路径加载首页

- **WHEN** 打包后的应用启动
- **THEN** 主窗口加载 `app://bundle/` 并渲染静态导出的首页

#### Scenario: 嵌套路由直接访问或刷新

- **WHEN** 用户访问或刷新 `app://bundle/report/`
- **THEN** 桌面壳返回对应的 `report/index.html`，而不是 404 或空白页

#### Scenario: 静态资源按精确路径返回

- **WHEN** 页面请求 `/_next/static/**` 下的脚本、样式或字体
- **THEN** 桌面壳返回对应文件并带有正确的 MIME 类型

#### Scenario: 未知路径返回 404 页面

- **WHEN** 请求的路径在静态导出中没有对应文件
- **THEN** 桌面壳返回静态导出的 404 页面，并使用 404 状态码

### Requirement: 渲染进程安全隔离

渲染进程 SHALL 在 sandbox 与 contextIsolation 开启、nodeIntegration 关闭的配置下运行；preload MUST 只暴露显式定义的最小 API，渲染进程 MUST NOT 直接访问 Node.js 或 Electron 主进程能力。

#### Scenario: 渲染进程没有 Node 能力

- **WHEN** 渲染进程尝试访问 `require`、`process` 或 Node 核心模块
- **THEN** 这些能力不可用，页面只能通过 preload 暴露的 API 与桌面壳交互

#### Scenario: preload 暴露最小接口

- **WHEN** 页面读取桌面壳注入的全局对象
- **THEN** 只能看到文档化的平台与版本信息，看不到任意 IPC 或文件系统入口

### Requirement: 导航与外部链接受限

主进程 SHALL 只允许导航到开发态前端地址或 `app://bundle/` 范围内的地址；MUST 拒绝新开 Electron 窗口，并把 http(s) 外部链接交给系统浏览器打开。

#### Scenario: 外部链接交给系统浏览器

- **WHEN** 页面触发一个 https 外部链接
- **THEN** 系统浏览器打开该链接，Electron 不创建新的应用窗口

#### Scenario: 非白名单导航被拦截

- **WHEN** 页面尝试导航到非白名单的 origin 或本地文件路径
- **THEN** 主进程阻止该导航，当前页面保持不变

#### Scenario: 路径穿越被拒绝

- **WHEN** 请求包含 `..`、编码后的穿越片段或空字节
- **THEN** 桌面壳返回 404，且不读取渲染资源根目录之外的文件

### Requirement: 打包产物可离线运行

`electron-forge make` SHALL 产出当前平台的可分发制品（本期为 Windows x64 ZIP）；解压后的应用 MUST 在没有 Next 开发服务器、没有系统 Node.js、没有仓库 `node_modules` 的情况下启动并渲染界面。

#### Scenario: make 产出 ZIP

- **WHEN** 在仓库根执行桌面 `make` 命令
- **THEN** `apps/desktop/out/make/zip/win32/x64/` 下生成可解压的 ZIP

#### Scenario: 解压后离线启动

- **WHEN** 在没有开发服务器和网络的环境中启动解压后的应用
- **THEN** 主窗口显示前端界面，静态资源加载完整

#### Scenario: 生产包不启动 Next 服务

- **WHEN** 打包应用运行期间检查进程与端口
- **THEN** 不存在 Next 服务器进程，也不监听 3000 端口

### Requirement: 构建时准备渲染资源

桌面构建 SHALL 在前端静态导出完成后，把 `apps/frontend/out` 复制为桌面包的 `renderer` 目录；静态导出缺失时 MUST 构建失败并提示先构建前端。

#### Scenario: 根构建先导出再复制

- **WHEN** 在仓库根执行 `pnpm build`
- **THEN** 前端静态导出先完成，随后桌面包获得最新的 `renderer` 资源

#### Scenario: 缺少静态导出时失败

- **WHEN** 桌面构建运行时 `apps/frontend/out/index.html` 不存在
- **THEN** 构建以非零退出码失败，并输出“先构建前端”的明确提示

#### Scenario: 成功复制后的目录内容

- **WHEN** 桌面构建成功完成
- **THEN** `apps/desktop/renderer` 包含 `index.html`、404 页面与 `_next` 静态资源

### Requirement: 单实例窗口

桌面壳 SHALL 使用单实例锁；应用已在运行时再次启动 MUST 复用并聚焦现有窗口，而不是创建第二个实例。

#### Scenario: 重复启动聚焦已有窗口

- **WHEN** 应用已运行，用户再次启动同一个桌面应用
- **THEN** 已有主窗口被显示并聚焦，没有新的应用实例或第二个主窗口
