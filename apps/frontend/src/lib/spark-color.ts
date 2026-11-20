// canvas 的 fillStyle 不解析 CSS 变量,且组件内 channels() 的正则只认 hex / rgb(),
// 而 radix-nova 的令牌是 oklch()——直接传令牌值会被解析成黑色。
// 这里把令牌经真实画布填充后取回像素,折算成组件可解析的 rgb() 色值。

const DEFAULT_TOKENS = ["--primary", "--foreground"] as const

/**
 * 把主题令牌解析为 rgb() 字符串,供 canvas 绘制使用。
 *
 * @param tokens - 依次尝试的 CSS 变量名,默认先 --primary 再 --foreground
 * @returns rgb() 字符串;SSR、无画布或令牌缺失时返回 undefined,调用方回落组件默认色
 */
export function resolveSparkColor(tokens: readonly string[] = DEFAULT_TOKENS): string | undefined {
  if (typeof window === "undefined") return undefined
  try {
    const probe = document.createElement("span")
    // display:none 的子树不参与样式计算,用 fixed + hidden 保证 color 能解析令牌
    probe.style.position = "fixed"
    probe.style.visibility = "hidden"
    document.body.appendChild(probe)
    try {
      let computed = ""
      for (const token of tokens) {
        probe.style.color = `var(${token})`
        computed = getComputedStyle(probe).color
        if (computed && computed !== "none") break
      }
      if (!computed || computed === "none") return undefined

      const canvas = document.createElement("canvas")
      canvas.width = 1
      canvas.height = 1
      const ctx = canvas.getContext("2d")
      if (!ctx) return undefined
      ctx.fillStyle = computed
      ctx.fillRect(0, 0, 1, 1)
      const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
      return `rgb(${r}, ${g}, ${b})`
    } finally {
      probe.remove()
    }
  } catch {
    // 解析失败时回落组件默认色,不能让特效拖垮页面
    return undefined
  }
}
