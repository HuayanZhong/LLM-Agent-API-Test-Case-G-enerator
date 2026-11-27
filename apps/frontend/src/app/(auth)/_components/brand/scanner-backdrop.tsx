"use client"

import { useTheme } from "next-themes"

import Scanner from "@workspace/ui/components/scanner"

// WebGL uniform 只接受数值 RGB，而主题变量是 oklch；这里按 neutral 色阶取近似值，
// 深色主题用暗→亮线，浅色主题用灰→近黑线，保证两套主题下的对比方向相反。
const PALETTE = {
  dark: { color1: "#3f3f46", color2: "#a1a1aa", color3: "#f4f4f5" },
  light: { color1: "#a1a1aa", color2: "#52525b", color3: "#18181b" },
} as const

/**
 * 左栏背景：单色扫描线。
 * 明暗主题各用一套灰度，亮线落在深底、暗线落在浅底，避免彩色光晕抢正文；
 * WebGL2 不可用时组件自身退化为空画布，内容不受影响。
 */
function ScannerBackdrop() {
  const { resolvedTheme } = useTheme()
  // 首帧 resolvedTheme 可能为空，先按深色渲染一帧，挂载后由 next-themes 纠正。
  const palette = resolvedTheme === "light" ? PALETTE.light : PALETTE.dark

  return (
    <Scanner
      color1={palette.color1}
      color2={palette.color2}
      color3={palette.color3}
      // 扫掠放慢、线宽收细、整体压暗；背景只提供“正在扫描”的暗示，不参与阅读节奏。
      speed={0.35}
      sweepSpeed={0.12}
      sweepWidth={1.4}
      trail={0.55}
      scale={1.2}
      frequency={2}
      ripple={0.18}
      bandDensity={8}
      lineWidth={0.7}
      glow={0.3}
      colorSpread={0.2}
      brightness={0.7}
      vignette={0.45}
      scanlineIntensity={0.25}
      grainIntensity={0.02}
      opacity={0.45}
      mouseRadius={0.4}
      mouseStrength={0.5}
      // 页面已挂全局点击火花，这里不再叠加 ping，避免两个点击反馈打架。
      clickEffect="none"
      lightMode={resolvedTheme === "light"}
      dpr={1.5}
    />
  )
}

export { ScannerBackdrop }
