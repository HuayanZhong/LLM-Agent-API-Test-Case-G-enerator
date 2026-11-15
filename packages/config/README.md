# @workspace/config

跨应用共享的环境变量解析与校验。源码包、无构建；只负责「解析 + 校验」，不负责加载。

## 职责

统一 `parseEnv`、`EnvError` 与六个工厂函数，让各应用用同一套规则校验自己的环境变量，非法配置在启动阶段直接失败。变量加载仍由根脚本的 `--env-file-if-exists` 与 Turbo strict 模式负责。

## 运行

本包没有 `dev` / `build` 脚本；有 `check-types`、`test`、`test:watch`、`lint`、`format`。

```bash
pnpm --filter @workspace/config check-types
pnpm --filter @workspace/config test      # vitest run --coverage，行覆盖率 ≥ 95%
pnpm --filter @workspace/config lint      # oxlint .，根配置
pnpm --filter @workspace/config format    # oxfmt --check .，根配置
```

消费方在 `dependencies` 声明（本包是运行时依赖，不是纯类型包）：

```json
"@workspace/config": "workspace:*"
```

## 目录

```text
packages/config/
├── src/env.ts           # 自包含 env 域：EnvError + parseEnv + 六个工厂 + re-export z
├── __tests__/env.test.ts
├── package.json         # exports 指向 ./src/env.ts；dependencies: zod
├── tsconfig.json        继承 @workspace/typescript-config/base.json
├── vitest.config.ts     继承 @workspace/vitest-config/base
├── README.md
├── CLAUDE.md
└── AGENTS.md
```

## 用法

```ts
import { envIntString, parseEnv, z } from "@workspace/config"

const schema = z.object({
  PORT: envIntString().default(5000),
})

export const config = parseEnv(schema, process.env, { label: "backend" })
```

schema 留在各应用内；本包不知道有哪些 app，也不定义端口、密钥等具体变量。

## 依赖与边界

- 运行时依赖只有 `zod`（`catalog:backend`），并 re-export `z`，让消费方共享同一版本入口。
- 包内**不写相对 import**：本包由 Node 直接加载 `.ts` 源码，`.js` 说明符不会映射到 `.ts`（Node 会 `ERR_MODULE_NOT_FOUND`），写 `.ts` 又会让 Nest 的 `tsc` 需要 `allowImportingTsExtensions`。因此一个配置域一个自包含文件，域与域之间不互相引用；新增域时另起文件并在 `exports` 中暴露。
- 只接受完全可擦除的语法；不要用 `enum`、`namespace`、参数属性等 Node 类型剥离不支持的写法。
- 不负责加载 `.env`，也不读 `process.env`；由调用方传入环境对象，测试才能直接覆盖成功与失败路径。
- 不放任何 app 专属 schema、controller DTO 或业务配置。

## 相关文档

- 根入口：[../../README.md](../../README.md)、[../../CLAUDE.md](../../CLAUDE.md)、[../../AGENTS.md](../../AGENTS.md)
- 行为规格：`shared-config` 能力，归档后位于 `openspec/specs/shared-config/spec.md`；索引见 [openspec/specs/](../../openspec/specs/)
- 同类源码包约束：[../vitest-config/CLAUDE.md](../vitest-config/CLAUDE.md)
- 文档同步规则：[../../.claude/rules/doc-sync.md](../../.claude/rules/doc-sync.md)
