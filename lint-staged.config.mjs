// 只处理暂存文件；整仓检查仍由 pnpm lint / pnpm format 负责
export default {
  "*.{ts,tsx,js,jsx,mjs,cjs}": ["oxlint --fix", "oxfmt"],
  // 覆盖根配置与 .github：它们不在任何 workspace 包里
  "*.{json,jsonc,yaml,yml,css}": ["oxfmt"],
}
