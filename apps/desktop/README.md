# apps/desktop

Electron 桌面壳：开发态加载 Next dev server，生产态托管 Next 静态导出。Electron Forge 8 + Electron 45。

## 职责

- 提供唯一主窗口、生命周期与 `app://` 协议；渲染进程只跑前端界面。
- 开发态加载 `http://localhost:3000`；生产态从 `app.asar` 的 `renderer/` 读取 Next 静态导出。
- 不托管 BFF / backend / chrome-devtools MCP，不包含 Next 运行时服务。

## 运行

在仓库根目录执行：

```bash
pnpm dev                        # Turbo 并行启动 frontend、bff、backend 与 desktop
pnpm --filter desktop dev       # 仅启动桌面壳（需先有 frontend dev server）
pnpm --filter desktop build     # 把 apps/frontend/out 复制为 renderer/
pnpm --filter desktop package   # 生成未打包目录到 apps/desktop/out/
pnpm --filter desktop make      # 生成 Windows x64 ZIP 到 out/make/zip/win32/x64/
pnpm --filter desktop test      # Vitest + 覆盖率，行覆盖率 ≥ 95%
pnpm --filter desktop check-types
```

`make` / `package` 前需存在 `apps/frontend/out/index.html`；仓库根 `pnpm build` 会先构建前端再复制，桌面脚本自身只做复制与校验。

Electron 二进制由 `electron` 包按需下载。网络无法直连 GitHub Releases 时，安装与打包前设置：

```bash
ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/ pnpm install
ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/ pnpm --filter desktop make
```

`pnpm-workspace.yaml` 的 `nodeLinker: hoisted` 是 Forge 8 的硬性要求，不能改回 isolated。

## 运行时行为

- 开发态：`bootstrap` 先轮询 `ELECTRON_RENDERER_URL`（默认 `http://localhost:3000`），最多 30 秒；超时后窗口显示本地诊断页，含目标地址与重试链接。
- 生产态：`main` 注册 `app` scheme，`protocol.handle` 从 `app.getAppPath()/renderer` 读取静态文件；`/` → `index.html`，`report/` → `report/index.html`，未知路径 → `404.html`，路径穿越一律 404。
- 窗口：单实例锁；初始 `1280×800`，最小 `1024×800`；移除 Electron 默认应用菜单；第二次启动聚焦已有窗口；关闭最后一个窗口时非 macOS 退出。
- 调试：开发态按 `F12` 或 `Ctrl+Shift+I` 切换 DevTools，启动时不自动打开；打包态不注册快捷键，也没有菜单入口。
- 安全：`sandbox` + `contextIsolation`，无 `nodeIntegration`；preload 只暴露 `platform` 与 `versions`；外链交给系统浏览器，非白名单导航与权限请求一律拒绝。
- 生产态不启动 Next 进程，也不监听 3000。

## 目录

```text
apps/desktop/
+-- forge.config.ts        # Vite 插件只编 main/preload；maker-zip、Fuses、ignore
+-- src/
|   +-- main.ts           # Electron 入口：注册 app scheme，调用 bootstrap
|   +-- preload.ts        # 最小 contextBridge
|   +-- app/
|   |   +-- bootstrap.ts  # 单实例、窗口、等待开发服务器、app:// 加载
|   |   +-- config.ts     # 开发 URL、app:// origin、允许 origin
|   |   +-- devtools.ts   # 开发态 F12 / Ctrl+Shift+I 切换 DevTools
|   |   +-- navigation.ts # 外链与导航白名单
|   +-- protocol/
|   |   +-- protocol.ts   # app:// 路径解析、MIME、CSP、404
|   +-- types/
|       +-- index.ts      # 主进程内部契约类型（窗口、协议、测试注入）
|       +-- global.d.ts   # Window.desktop 全局声明，引用 @workspace/types
+-- __tests__/            # config / navigation / protocol / bootstrap / preload
+-- vite.main.config.mts
+-- vite.preload.config.mts
+-- .vite/build/           # Forge/Vite 生成物（gitignored）
+-- renderer/             # 从 apps/frontend/out 复制（gitignored）
+-- out/                  # Forge package/make 产物（gitignored）
```

## 产品与打包产物

- 包名 / 应用目录：`ApiTestAgent`；Windows 可执行文件：`api-test-agent.exe`；窗口标题：`接口测试用例辅助生成系统`。
- 图标：当前未提供自定义图标，使用 Electron 默认图标；后续在 `packagerConfig.icon` 指定 `.ico` 并重新打包。
- ZIP：`apps/desktop/out/make/zip/win32/x64/ApiTestAgent-win32-x64-0.0.0.zip`。

## 打包验证记录

```bash
# 1. asar 只含运行所需文件
cd apps/desktop && pnpm exec asar list out/ApiTestAgent-win32-x64/resources/app.asar
# 输出仅 .vite/build/main.cjs、preload.cjs、package.json、renderer/**；无 node_modules

# 2. 运行未打包目录或 ZIP 解压后的 exe，检查端口
powershell -NoProfile -Command 'foreach ($port in 3000,4000,5000) { (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Measure-Object).Count }'
# 期望 3000=0、4000=0、5000=0

# 3. 读取打包 exe 的 Fuses
node --input-type=module -e "import { getCurrentFuseWire, FuseV1Options } from '@electron/fuses'; const w = await getCurrentFuseWire('apps/desktop/out/ApiTestAgent-win32-x64/api-test-agent.exe'); console.log(w[FuseV1Options.RunAsNode], w[FuseV1Options.OnlyLoadAppFromAsar])"
# 输出 48 49：'0'=关闭、'1'=开启；RunAsNode 关闭，OnlyLoadAppFromAsar 开启
```

- Fuses 实测：RunAsNode=`0`、CookieEncryption=`1`、NodeOptions=`0`、NodeCliInspect=`0`、EmbeddedAsarIntegrityValidation=`0`、OnlyLoadAppFromAsar=`1`。
- `EmbeddedAsarIntegrityValidation` 暂不启用：需要额外的 ASAR 完整性元数据与签名链路，当前 ZIP 未做代码签名；留到安全加固变更。
- 开发态通过 `F12` / `Ctrl+Shift+I` 切换 DevTools；生产态不注册快捷键，也不调用 `openDevTools`。
- 渲染隔离实测（打包 exe + `--remote-debugging-port=9222`，CDP `Runtime.evaluate`）：`location.origin = app://bundle`；`window.desktop` 只有 `platform` / `versions`；`typeof require = undefined`、`typeof process = undefined`。
- ZIP 已解压到独立目录并在无 dev server 时启动，首页、404 与静态资源正常。

## 依赖与边界

- 本包没有运行时 `dependencies`；Electron、Forge、Vite 全在 `devDependencies`，打包时被 prune。
- `DesktopBridge` 来自 `@workspace/types`（`devDependencies`，只做 `import type`）；窗口、协议与测试注入等主进程内部契约仍留在 `src/types/index.ts`，不上移到共享包。
- 版本走 `pnpm-workspace.yaml` 的 `desktop` catalog；`@types/node` 固定 24.x，对齐 Electron 45 内置的 Node 24.22.2。
- Next、React、`@workspace/ui` 只属于 `apps/frontend` 的构建期依赖，不进入桌面包。
- Vite 插件默认 `ignore` 只保留 `.vite`；`forge.config.ts` 必须显式保留 `renderer` 与 `package.json`。

## 相关文档

- 包级 AI 规则：[CLAUDE.md](CLAUDE.md)
- 跨工具入口：[AGENTS.md](AGENTS.md)
- 项目总览：[../../README.md](../../README.md)
- 前端包：[../frontend/README.md](../frontend/README.md)
- Forge 配置与打包：[../../doc/README.md](../../doc/README.md)
