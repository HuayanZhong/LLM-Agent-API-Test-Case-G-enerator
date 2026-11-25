import { readdirSync, readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

/** 前端源码根目录；这两个扫描型测试只读文件，不参与覆盖率统计。 */
const SOURCE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src")

function collectSources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      return collectSources(full)
    }
    return entry.name.endsWith(".ts") || entry.name.endsWith(".tsx") ? [full] : []
  })
}

/**
 * 去掉注释后再检查：注释允许中文与 px 说明，业务代码里出现才算违规。
 * 用逐字符扫描而不是正则，避免把字符串里的 // 误判成行注释。
 */
function stripComments(source: string): string {
  let output = ""
  let state: "code" | "line" | "block" | "single" | "double" | "template" = "code"

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index]
    const next = source[index + 1]

    if (state === "line") {
      if (char === "\n") {
        state = "code"
        output += char
      }
      continue
    }

    if (state === "block") {
      if (char === "*" && next === "/") {
        index += 1
        state = "code"
      }
      continue
    }

    if (state === "single" || state === "double" || state === "template") {
      output += char
      // 转义字符后面的引号不结束字符串。
      if (char === "\\") {
        output += next ?? ""
        index += 1
        continue
      }
      const closer = state === "single" ? "'" : state === "double" ? '"' : "`"
      if (char === closer) {
        state = "code"
      }
      continue
    }

    if (char === "/" && next === "/") {
      index += 1
      state = "line"
      continue
    }
    if (char === "/" && next === "*") {
      index += 1
      state = "block"
      continue
    }
    if (char === "'") {
      state = "single"
      output += char
      continue
    }
    if (char === '"') {
      state = "double"
      output += char
      continue
    }
    if (char === "`") {
      state = "template"
      output += char
      continue
    }
    output += char
  }

  return output
}

/** 按违规内容收集文件名，供断言直接打印相对路径。 */
export function findOffenders(pattern: RegExp): string[] {
  return collectSources(SOURCE_ROOT)
    .filter((file) => {
      const source = stripComments(readFileSync(file, "utf8"))
      // 全局标志的正则有 lastIndex 状态，每次先重置。
      pattern.lastIndex = 0
      return pattern.test(source)
    })
    .map((file) => path.relative(SOURCE_ROOT, file))
}
