import { coverageConfigDefaults, defineConfig } from "vitest/config"
import { base as baseProfile } from "@workspace/vitest-config"

export default defineConfig({
  ...baseProfile,
  test: {
    ...baseProfile.test,
    include: ["__tests__/**/*.test.ts"],
    coverage: {
      ...baseProfile.test.coverage,
      include: ["src/**/*.ts"],
      // main.ts 只做组合与生命周期接线；行为在 bootstrap / protocol / navigation 中测试。
      exclude: [...coverageConfigDefaults.exclude, "src/main.ts", "src/global.d.ts"],
    },
  },
})
