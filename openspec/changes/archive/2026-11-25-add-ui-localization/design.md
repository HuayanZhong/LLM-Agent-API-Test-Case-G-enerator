# Design

## Context

前端是 Next.js 16 App Router + `output: "export"`，生产形态由 Electron `app://` 托管 `out/`。认证页与品牌栏的用户可见文案目前直接写在组件里，校验函数直接返回中文句子，测试也按中文断言。项目没有 middleware / 服务端运行时，URL 与 `app://` 路径是桌面壳的稳定契约。

仓库已有十个 workspace 包，每个包都有独立的 `README.md` / `CLAUDE.md` / `AGENTS.md`、自己的 `check-types` / `test` / `lint` / `format` 脚本，并通过 Changesets 的 `fixed` 组共享版本。本次按用户要求把文案目录从 app 内部移到 `packages/`。

## Goals / Non-Goals

**Goals:**

- 中文（zh-CN）为默认语言，英文（en-US）为第二语言，可在运行时即时切换。
- 所有用户可见文案来自 `packages/i18n` 的统一文案目录；校验函数只产出错误键，不产出自然语言。
- 语言偏好本地持久化，切换后同步 `<html lang>` 与页面标题。
- 不改变现有 URL、静态导出产物路径和 Electron `app://` 入口。

**Non-Goals:**

- `[locale]` 路由、middleware / proxy 语言协商、按 URL 生成多语言静态页面。
- 浏览器语言自动探测、第三种语言、按区域细分（如 en-GB / zh-TW）。
- BFF / backend 的错误消息本地化、Electron 原生窗口标题的 IPC 联动。
- 把 React Provider / 切换组件也放进 `packages/i18n`（这些依赖 Next、React 与浏览器存储，留在前端）。

## Decisions

### 1. 采用 next-intl 纯客户端模式

`next-intl` 4.15 的 peer 已声明支持 Next 16 / React 19。只使用 `NextIntlClientProvider` + `useTranslations`，不启用 `defineRouting` / middleware / `[locale]` 路由，消息 JSON 静态打入客户端包。

- **备选：i18next + react-i18next**。功能足够，但不是 Next 原生方案，类型要靠 declaration merging，且同样不支持服务端组件；对这个只做客户端切换的场景没有额外收益。
- **备选：Lingui**。编译期提取更优雅，但要引入 Babel/SWC 宏与提取流程，和当前 Oxc 工具链并行维护两套编译配置，成本高于收益。
- **备选：手写类型化字典**。零依赖，但没有 ICU 复数/插值与日期数字格式化，后续扩展语言要自己造轮子。
- **备选：next-intl + `[locale]` 路由**。能获得每语言独立 URL 与静态 HTML，但要把 `app/` 重构为 `app/[locale]/`，同步改链接、测试与 Electron 根入口；桌面应用没有分享语言 URL 的需求，暂不采用。文案目录与 API 保持 next-intl 标准形态，未来迁移成本低。

### 2. 文案目录放进新的共享包 `@workspace/i18n`

新增 `packages/i18n`，只包含文案 JSON、语言配置与类型，不依赖 React / Next / 浏览器 API；`apps/frontend` 通过 `@workspace/i18n` 引用。Provider、切换组件与本地存储读写仍留在 `apps/frontend/src/components`。

- **理由：文案是跨层资产**。语言目录不是某个路由组的私有文件；放在 `src/app` 下会让后续页面、`packages/ui` 组件文案与第二个前端难以复用，也会让「文案改了」和「页面改了」混在同一次 diff。
- **备选：留在 `apps/frontend/src/i18n`**。目录更近、改动更少，但只有单一消费方时看似合理，一旦共享组件需要文案就会被迫上移，届时要改所有 import。
- **备选：塞进 `packages/ui`**。不新增包，但 `packages/ui` 的边界是 shadcn 组件、`cn()` 与 Tailwind 样式；把产品文案放进去会让设计系统包承担内容职责，后续容易变成什么都往里放的杂货包。
- **代价**：workspace 从十个包变为十一个。必须同步 `.changeset/config.json` 的 `fixed` 组、`scripts/sync-version.mjs` 的包列表、根级文档中的包数量，并新增该包的三份包级文档。

包形态（与 `packages/types` 同为源码包、无构建）：

```
packages/i18n/
  package.json        # name @workspace/i18n；exports "." -> ./src/index.ts
  tsconfig.json       # extends @workspace/typescript-config/base.json；include src
  src/
    config.ts         # locales、defaultLocale、LOCALE_STORAGE_KEY、isLocale()
    messages/
      zh-CN.json      # 键集合唯一事实来源
      en-US.json      # satisfies 同一结构
    index.ts          # 导出 config、messages、Messages 类型
  __tests__/          # 配置与词表一致性测试
```

### 3. Provider 首帧固定默认语言，挂载后再读偏好

`LocaleProvider` 的初始 state 永远是 `defaultLocale`（zh-CN），只在 `useEffect` 中读取本地存储并更新。这样静态 HTML 与客户端首帧一致，不会触发 hydration mismatch；已保存英文的用户会看到一次中文首帧后切到英文。

- **备选：渲染期读 localStorage**。会在英文偏好下产生 hydration 警告，React 19 下还可能丢弃整棵客户端树，不可取。
- **备选：内联脚本预热文案**。静态 HTML 的文本在构建期已定死，脚本无法在首帧前替换文本；只能减少布局抖动，不能消除语言闪现，因此不做。

### 4. 偏好存储沿用现有命名空间

语言偏好写入 `interface-test-agent:locale`（与“记住邮箱”的键同一前缀），值为 BCP 47 标签；读取到未知值或非法值时回落默认语言。不使用 cookie：静态导出没有服务端读取方，cookie 反而增加桌面 `app://` 下的一致性问题。

存储键与语言集合定义在 `@workspace/i18n/config`；`localStorage` 读写留在前端，避免共享包绑定浏览器运行时。

### 5. 文案结构与类型约束

`packages/i18n/src/messages/zh-CN.json` 是键集合的唯一事实来源，`en-US.json` 用 `satisfies` 约束为同一结构；`Messages` 类型从 `zh-CN` 推导并由包导出，前端通过模块扩充获得 `t()` 的键补全。命名空间按界面区域划分（`common`、`auth`、`brand`、`fields`、`meta`），不把整页文案塞进单一扁平对象。

两份 JSON 由包入口静态导出，前端一次性 import：当前规模只有几十条，体积远小于一个图标库，避免异步加载带来的首帧空文案与错误处理分支。

### 6. 校验函数返回错误键

`validate-auth.ts` 的 `AuthErrors` 从 `string` 改为错误键联合类型（如 `emailRequired`、`passwordMin`），插值参数（`min`、`length`）由展示层传入 `t()`。理由：纯函数保持无 Provider 依赖、可独立单测；文案改版不影响校验逻辑；英文与中文共享同一组错误语义。错误键定义在前端校验层，不放进共享文案包，避免包与业务规则耦合。

- **备选：把 `t` 传进校验函数**。让纯逻辑依赖 React 上下文，测试需要构造翻译器，反而更脆。
- **备选：返回完整句子**。等于把文案写回业务层，正是本次要消除的问题。

### 7. 切换组件采用下拉菜单

入口使用 shadcn 的 `DropdownMenu`（CLI 拉入 `@workspace/ui/components/dropdown-menu`），`DropdownMenuRadioGroup` + `DropdownMenuRadioItem` 维护单选状态。触发器是“地球图标 + 当前语言代码 + 下箭头”，菜单项显示完整语言名，右侧用勾选指示当前项。

- 相比分段按钮，下拉在增加第三种语言时不需要重排头部，也便于后续整体移入设置页。
- 选择文本而非国旗图标：产品是工具类桌面应用，国旗会引入地域歧义，也与当前等宽、台账式的视觉语言冲突。
- `DropdownMenu` 是 CLI 拉入的组合原语，`packages/ui` 的覆盖率配置把它排除；实际使用的 Trigger / RadioGroup / RadioItem 由前端语言切换测试覆盖。

### 8. 页面标题、描述与 `<html lang>` 由 Provider 同步

根 `metadata` 在构建期仍是中文；Provider 在语言变化后设置 `document.documentElement.lang`、`document.title` 与 `meta[name="description"]` 的内容（文案来自 `meta` 命名空间）。Next 在 hydration 后可能再次写入静态 metadata，Provider 观察 `<head>` 并在被覆盖时重新应用。静态 HTML 的初始标题因此保持 zh-CN，符合默认语言；不为此引入 `[locale]` 路由。

### 9. 测试与覆盖率

- `packages/i18n`：测试语言配置、非法值回落与中英键集合一致性，纳入该包 95% 行覆盖率门槛。
- `apps/frontend`：新增 `__tests__/test-utils.tsx` 提供带 `NextIntlClientProvider` 的渲染辅助，默认 zh-CN；现有中文断言继续有效；新增英文切换、偏好持久化、校验错误键、倒计时插值与语言切换保留表单状态的用例。

## Risks / Trade-offs

- **新增第 11 个包扩大维护面** → 文档、Changesets `fixed` 组、`sync-version.mjs` 与包级三份文档都在本次任务内一次改完；`pnpm sherif` / `knip` 复核。
- **英文偏好刷新时出现中文首帧** → 默认语言仍是中文，目标用户以中文为主；挂载后的切换在同一帧内完成，不阻塞交互。若后续要求零闪现，只能改用 `[locale]` 路由生成双语静态页。
- **静态 HTML 与 metadata 只有中文** → 桌面应用不依赖 SEO；页面标题在运行时按语言更新。搜索引擎抓取场景不在本期范围。
- **客户端包同时包含两份文案** → 每份约数 KB，可接受；若语言增至五种以上，再改为按需异步加载。
- **中英键集漂移** → `en-US` 用类型约束 + 包内单测比较键集合，缺少键时构建或测试失败。
- **English 文案质量** → 文案属于产品表达，不能机器直译；英文初稿随实现提交，答辩前再做一轮人工校对。
- **Electron 原生窗口标题** → 页面标题变化通常同步到窗口标题，但若被 `BrowserWindow` 固定则不变；本期不改主进程，作为已知限制记录。
- **`sync-version.mjs` 当前漏了 `packages/request`** → 本次新增 `packages/i18n` 时顺带补齐该列表，避免版本同步继续漏包。

## Migration Plan

1. 新建 `packages/i18n`：包配置、语言配置、双语 JSON、类型与测试；在 Changesets `fixed` 组与 `sync-version.mjs` 注册。
2. 在 `frontend` catalog 增加 `next-intl`，`apps/frontend` 增加 `@workspace/i18n` 依赖，`transpilePackages` 加入该包，确认静态构建通过。
3. 建立 LocaleProvider 与 LocaleToggle，先让现有中文文案从共享包读取，行为不变。
4. 改造校验函数为错误键，更新表单展示层与测试。
5. 补充英文文案，逐组件切换为 `useTranslations`；品牌栏改为客户端组件。
6. 更新包级与根级文档、`openspec/config.yaml` 与 changeset；运行 `check-types`、`test`、`build` 与桌面加载验证。

回滚策略：该变更不涉及数据迁移与外部服务，回滚即还原依赖、包目录与前端代码提交；本地语言偏好键可保留，旧代码会忽略它。

## Open Questions

- 英文产品名与品牌副标题的最终措辞（不影响结构，可在实现阶段或答辩前定稿）。
- 是否需要在未来让 Electron 原生窗口标题也跟随语言（需要 preload/IPC 扩展，另立变更）。
