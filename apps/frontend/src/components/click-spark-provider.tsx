"use client"

import { useEffect, useState } from "react"
import ClickSpark, { type ClickSparkProps } from "@workspace/ui/components/click-spark"

import { resolveSparkColor } from "@/lib/spark-color"

/**
 * 默认动效参数:用户在 reactbits demo 调定的组合。
 * demo 的 preset=comet 由 shape/streak 等参数组合复现,此处按调参取 star 形。
 */
const DEFAULT_SPARK_PROPS = {
  sparkCount: 9,
  sparkSize: 8,
  sparkRadius: 14,
  sparkWidth: 1.5,
  duration: 350,
  easing: "spring",
  shape: "star",
  randomness: 0.05,
  glow: 1,
  ring: true,
} satisfies Partial<ClickSparkProps>

type ClickSparkProviderProps = Omit<ClickSparkProps, "layer">

/**
 * 全站点击火花适配层:挂根布局、包住全部页面内容。
 * 颜色取主题令牌;特效层只绘制不拦截交互。
 */
function ClickSparkProvider(props: ClickSparkProviderProps) {
  // 初始色在首帧解析:next-themes 的内联脚本先行设置 html class,SSR 下回落组件默认色
  const [sparkColor, setSparkColor] = useState<string | undefined>(() => resolveSparkColor())

  useEffect(() => {
    // next-themes 先改 DOM class 再触发 React 重渲染,渲染期读令牌会拿到旧主题色值;
    // 监听 class 真实变更后重解析,同时覆盖手动切换与跟随系统的场景
    const observer = new MutationObserver(() => {
      setSparkColor(resolveSparkColor())
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    return () => observer.disconnect()
  }, [])

  // layer 固定 front:火花绘制在内容之上,配合组件内 pointer-events-none 不拦截点击
  return <ClickSpark layer="front" sparkColor={sparkColor} {...DEFAULT_SPARK_PROPS} {...props} />
}

export { ClickSparkProvider }
