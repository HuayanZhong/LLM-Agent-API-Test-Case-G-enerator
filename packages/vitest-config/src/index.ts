import type { ViteUserConfig } from "vitest/config"

// 只放无路径语义的 test 选项；include / setupFiles / coverage.include 留各包，
// 否则会按 Vitest 的 root 解析，跑到别的目录去。
export const base = {
  test: {
    environment: "node",
    clearMocks: true,
    passWithNoTests: true,
    coverage: {
      provider: "v8",
      // html 默认关闭：CI 要的是 lcov 与 json-summary，本地需要可视化时用
      // --coverage.reporter=html 临时打开，避免每个包都堆一份大 HTML。
      reporter: ["text", "lcov", "json-summary"],
      thresholds: { lines: 95 },
    },
  },
} satisfies ViteUserConfig

export const react = {
  ...base,
  test: {
    ...base.test,
    environment: "jsdom",
  },
} satisfies ViteUserConfig
