import { coverageConfigDefaults, defineConfig } from "vitest/config"
import { base } from "@workspace/vitest-config"

export default defineConfig({
  ...base,
  resolve: { tsconfigPaths: true },
  test: {
    ...base.test,
    include: ["src/**/*.spec.ts"],
    coverage: {
      ...base.test.coverage,
      include: ["src/**/*.ts"],
      // main.ts 顶层 await 会启动服务，不纳入单元覆盖率。
      exclude: [...coverageConfigDefaults.exclude, "src/main.ts"],
    },
  },
})
