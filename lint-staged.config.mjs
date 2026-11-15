// 只处理暂存文件；整仓检查仍由 pnpm lint / pnpm format 负责
// 暂存文件可能命中 .oxfmtrc.json 的 ignorePatterns（openspec/**、next-env.d.ts 等），
// oxfmt 会因没有可处理文件而失败；--no-error-on-unmatched-pattern 让 hook 跳过这些文件。
export default {
  "*.{ts,tsx,js,jsx,mjs,cjs}": ["oxlint --fix", "oxfmt --no-error-on-unmatched-pattern"],
  // 覆盖根配置与 .github：它们不在任何 workspace 包里
  "*.{json,jsonc,yaml,yml,css}": ["oxfmt --no-error-on-unmatched-pattern"],
}
