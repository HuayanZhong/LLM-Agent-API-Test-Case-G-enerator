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
      reporter: ["text", "html"],
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
