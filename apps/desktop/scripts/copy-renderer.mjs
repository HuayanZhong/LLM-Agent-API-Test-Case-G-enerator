import { access, cp, rm } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const desktopRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const frontendOut = path.resolve(desktopRoot, "..", "frontend", "out")
const rendererDir = path.join(desktopRoot, "renderer")
const indexHtml = path.join(frontendOut, "index.html")

try {
  await access(indexHtml)
} catch {
  console.error("前端静态导出缺失：请先运行 pnpm --filter frontend build")
  process.exit(1)
}

await rm(rendererDir, { recursive: true, force: true })
await cp(frontendOut, rendererDir, { recursive: true })
console.log(`renderer <- ${frontendOut}`)
