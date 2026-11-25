import { readFileSync, writeFileSync } from "node:fs"
import path from "node:path"

// Changesets 只管理 workspace 包；根 package.json 不在 packages/* 中，需要单独同步。
const packages = [
  "apps/backend",
  "apps/bff",
  "apps/desktop",
  "apps/frontend",
  "packages/config",
  "packages/i18n",
  "packages/request",
  "packages/types",
  "packages/typescript-config",
  "packages/ui",
  "packages/vitest-config",
]

const versions = packages.map((dir) => {
  const pkg = JSON.parse(readFileSync(path.join(dir, "package.json"), "utf8"))
  return { name: pkg.name, version: pkg.version }
})

const unique = new Set(versions.map((item) => item.version))
if (unique.size !== 1) {
  console.error("workspace 版本不一致：")
  for (const item of versions) console.error(`  ${item.name}: ${item.version}`)
  process.exit(1)
}

const version = versions[0].version
const rootPath = "package.json"
const root = JSON.parse(readFileSync(rootPath, "utf8"))
if (root.version !== version) {
  root.version = version
  writeFileSync(rootPath, `${JSON.stringify(root, null, 2)}\n`)
}
console.log(`root package.json -> ${version}`)
