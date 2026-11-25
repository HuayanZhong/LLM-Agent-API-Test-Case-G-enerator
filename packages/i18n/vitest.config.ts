import { defineConfig } from "vitest/config"
import { base } from "@workspace/vitest-config"

export default defineConfig({
  ...base,
  test: {
    ...base.test,
    include: ["__tests__/**/*.test.ts"],
    coverage: {
      ...base.test.coverage,
      include: ["src/**/*.ts"],
    },
  },
})
