# Tasks

## 1. 打包可行性 spike

- [x] 1.1 在临时目录创建最小 pnpm workspace 与 desktop fixture（零 `dependencies`，Forge 8 + Electron 45 + `plugin-vite` + Vite 8），验证 `pnpm install` 与 `electron-forge start` 能启动最小窗口；记录实际命令与结果。
- [x] 1.2 在 fixture 上运行 `electron-forge package`，检查 `resources/app.asar` 只包含 `.vite/build`、`renderer` 与 `package.json`，确认 pnpm isolated 布局是否需要 `node-linker=hoisted`；若失败，记录 `pnpm deploy` staging 备选与影响。
- [x] 1.3 用最小静态 HTML 验证 `protocol.handle('app')` 能从普通目录与 asar 内读取文件；若失败，确定 `asarUnpack: "renderer/**"` 或关闭 asar 的备选，并记录验证方式。
- [x] 1.4 根据 1.1–1.3 的结果确认 go/no-go 与最终打包策略；若与 design 的默认不同，先更新 `design.md` 的 Decisions / Risks，再进入后续任务。

## 2. 前端静态导出

- [x] 2.1 修改 `apps/frontend/next.config.ts`，加入 `output: "export"`、`trailingSlash: true`、`images: { unoptimized: true }`；运行 `pnpm --filter frontend build`，验证 `apps/frontend/out/index.html` 存在且 `_next` 资源已生成。
- [x] 2.2 从 `apps/frontend/package.json` 移除 `start` 脚本，更新 `apps/frontend/README.md` 与 `apps/frontend/CLAUDE.md`（静态导出约束、`next start` 移除、可用命令）；核对文档中的命令与 `package.json` 一致。
- [x] 2.3 运行 `pnpm --filter frontend test`、`check-types`、`lint`、`format`，确认静态导出改动未破坏现有页面测试、类型检查与格式检查。

## 3. 桌面包骨架与 Forge 配置

- [x] 3.1 创建 `apps/desktop/package.json`（`name: desktop`、`type: module`、`main: .vite/build/main.cjs`、dev/build/package/make/check-types/test/lint/format 脚本），在 `pnpm-workspace.yaml` 增加 `desktop` catalog，并在 `allowBuilds` 加 `electron: true`；验证 `pnpm install` 成功且 `pnpm --filter desktop exec electron-forge --version` 可运行。
- [x] 3.2 添加 `apps/desktop/tsconfig.json`（继承 base、`moduleResolution: Bundler`、`@types/node` 24.x）与 `vitest.config.ts`（base profile、`coverage.include: ["src/**/*.ts"]`、排除 `src/main.ts`），以及 `.gitignore`（`renderer/`、`.vite/`）；验证 `pnpm --filter desktop check-types` 与 `test` 可执行。
- [x] 3.3 编写 `forge.config.ts`（`plugin-vite` 只配 main/preload、`renderer: []`、`maker-zip`、Fuses、`packagerConfig.asar`/`name`/`ignore`）与 `vite.main.config.mts` / `vite.preload.config.mts`；运行 `pnpm --filter desktop exec electron-forge start`，确认生成 `.vite/build/main.cjs` 与 `preload.cjs` 且 Electron 能启动最小窗口。
- [x] 3.4 创建 `apps/desktop/README.md`、`CLAUDE.md`、`AGENTS.md`，写清职责、命令、无独立端口、Forge/pnpm 打包坑与验证命令；检查三份文件互链及根规则链接可达。

## 4. Electron 运行时与安全

- [x] 4.1 实现 `src/config.ts` 与 `src/navigation.ts`：开发 URL 解析（默认 `http://localhost:3000`）、allowed origins、外链判断；为纯函数写 Vitest 用例，`pnpm --filter desktop test` 覆盖这些分支。
- [x] 4.2 实现 `src/protocol.ts`：scheme 注册、路径解析（精确文件 → `index.html` → `.html` → 404）、MIME、路径穿越拒绝、CSP 与缓存头；用临时目录测试根路径、嵌套路由、静态资源、404 与穿越场景，行覆盖达到门槛。
- [x] 4.3 实现 `src/bootstrap.ts` 与 `src/main.ts`：单实例锁、`show: false` + `ready-to-show`、sandbox/contextIsolation/preload、开发服务器等待重试、生产 `app://bundle/` 加载、导航与新窗口拦截；用 mock Electron 测试 bootstrap 分支，并手动运行前端 dev + `pnpm --filter desktop dev` 看到页面。
- [x] 4.4 实现 `src/preload.ts` 的最小 `contextBridge` API；验证渲染进程访问 `require` / `process` 失败，`window.desktop` 只包含已文档化的平台与版本字段。
- [x] 4.5 更新 `apps/desktop/README.md` 与 `CLAUDE.md` 的运行时、安全边界、开发等待与协议说明；逐条对照实现，确认文档没有描述未实现的能力。

## 5. 构建接线与根命令

- [x] 5.1 实现 `scripts/copy-renderer.mjs`：检查 `../frontend/out/index.html`，存在则清空并复制到 `renderer/`，缺失则非零退出并输出“先构建前端”；手动删除 `out` 验证失败提示，正常构建验证 `renderer` 含 `index.html`、404 页面与 `_next`。
- [x] 5.2 更新 `turbo.json`：`build.outputs` 加 `out/**`，新增 `desktop#build`（`dependsOn: ["frontend#build"]`、`outputs: ["renderer/**"]`），`dev.env` 加 `ELECTRON_RENDERER_URL`；运行根 `pnpm build` 验证先导出、后复制。
- [x] 5.3 更新根 `README.md`、`CLAUDE.md`、`AGENTS.md` 的 app 数量、`pnpm dev` 行为、构建/打包命令与目录结构；按文档中的新命令实际执行一遍。
- [x] 5.4 运行根 `pnpm dev`，验证 Electron 窗口与前端页面出现；若 Turbo TUI 与 Forge 交互冲突，按 design 备选拆出 `dev:desktop` 并同步文档。

## 6. 打包、离线验证与 Fuses

- [x] 6.1 确定产品名与图标：包名/exe 用 ASCII，窗口标题用中文；若有图标则配置 `packagerConfig.icon`，验证打包产物包含图标；把最终值写入桌面 README。
- [x] 6.2 运行 `pnpm --filter desktop package`，检查未打包目录能启动；若 asar 内协议读取失败，按 design 备选调整并记录结果。
- [x] 6.3 运行 `pnpm --filter desktop make`，验证 `apps/desktop/out/make/zip/win32/x64/` 生成 ZIP；解压后在无 dev server、无网络环境启动，确认首页、嵌套路由与 404 页面正常。
- [x] 6.4 检查生产包：无 Next 进程、不监听 3000、无 `node_modules` 运行时依赖、生产态不打开 DevTools；把检查命令与结果写入桌面 README。
- [x] 6.5 验证 Fuses 生效（至少 `RunAsNode=false`）；评估 `EmbeddedAsarIntegrityValidation`，若不启用则在 `design.md` 与桌面 README 记录原因。

## 7. 文档同步与集成校验

- [x] 7.1 更新 `openspec/config.yaml` 的 `context`（Electron 已接入、静态导出、Forge 8 / Electron 45、桌面包状态），运行 `openspec validate --all` 确认通过。
- [x] 7.2 修改 `doc/source/technical-architecture.candidate.json` 的桌面端措辞（主进程托管静态资源、不拉起 Next 进程），用新的 `--out-dir` 运行 Archify `finalize`；确认退出码 0 且 `doc/technical-architecture.html` 已更新。
- [x] 7.3 运行根 `pnpm lint`、`format`、`check-types`、`test`，确认桌面包行覆盖率 ≥ 95% 且其他包无回归。
- [x] 7.4 按 `.claude/rules/doc-sync.md` 清单检查 README / CLAUDE / AGENTS / `doc/README.md` / `openspec` 的链接与命令；对无需更新的项记录原因。

## Workflow follow-up

- 归档前先按仓库评审要求确认实现与验证结果。
- 归档后确认 `openspec/specs/desktop-shell/spec.md` 已生成且 `openspec validate --all` 通过。
