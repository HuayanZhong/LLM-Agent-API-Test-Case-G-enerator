import { readFile, readdir, writeFile } from "node:fs/promises"
import path from "node:path"

// Changesets 把分节标题写死在 apply-release-plan 里，生成器改不了，
// 只能在 `changeset version` 之后补图标。重复执行不会叠加。
const SECTION_ICONS = [
  ["Major Changes", "💥"],
  ["Minor Changes", "✨"],
  ["Patch Changes", "🩹"],
]

async function formatChangelog(file) {
  const before = await readFile(file, "utf8")
  let after = before
  for (const [title, icon] of SECTION_ICONS) {
    after = after.replace(new RegExp(`^### ${title}$`, "gm"), `### ${icon} ${title}`)
  }
  if (after === before) return false
  await writeFile(file, after)
  return true
}

const changed = []
for (const root of ["apps", "packages"]) {
  let entries
  try {
    entries = await readdir(root, { withFileTypes: true })
  } catch {
    // 目录不存在时跳过，脚本要能在任意 checkout 里跑
    continue
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const file = path.join(root, entry.name, "CHANGELOG.md")
    try {
      if (await formatChangelog(file)) changed.push(file)
    } catch (error) {
      if (error.code !== "ENOENT") throw error
    }
  }
}

const summary = changed.length
  ? changed.map((file) => path.basename(path.dirname(file))).join(", ")
  : "无变更"
console.log(`changelog icons -> ${summary}`)
