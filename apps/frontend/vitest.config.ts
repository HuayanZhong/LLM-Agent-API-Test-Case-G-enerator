import { coverageConfigDefaults, defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import { react as reactProfile } from "@workspace/vitest-config"

export default defineConfig({
  ...reactProfile,
  plugins: [react()],
  // Vite 8 原生读取 tsconfig paths，不再需要 vite-tsconfig-paths（其 tsconfck 与 TS 6 peer 不兼容）。
  resolve: { tsconfigPaths: true },
  test: {
    ...reactProfile.test,
    include: ["__tests__/**/*.test.{ts,tsx}"],
    setupFiles: ["./__tests__/setup.ts"],
    coverage: {
      ...reactProfile.test.coverage,
      include: ["src/**/*.ts", "src/**/*.tsx"],
      // 根布局是 Next 框架入口（html/body/metadata），不纳入单元覆盖率。
      exclude: [...coverageConfigDefaults.exclude, "src/app/layout.tsx"],
    },
  },
})
