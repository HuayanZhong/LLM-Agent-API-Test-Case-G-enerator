import { defineConfig } from "vitest/config"
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
      // click-spark / scanner 是 CLI 拉入的第三方动效实现(canvas / WebGL 渲染,jsdom 不可测),
      // 交互行为由 apps/frontend 的适配层与页面测试覆盖,这里只排除组件内部实现。
      exclude: ["src/components/click-spark.tsx", "src/components/scanner.tsx"],
    },
  },
})
