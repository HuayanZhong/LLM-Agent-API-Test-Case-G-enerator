import { cn } from "@workspace/ui/lib/utils"

/**
 * 产品几何标记：三条横线代表请求、比对与报告。
 * 用前景 / 背景 token 画线，明暗主题自动反转，也不依赖图片资源。
 */
function ProductMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-9 shrink-0 flex-col justify-center gap-1 rounded-lg bg-foreground px-2",
        className,
      )}
    >
      {/* 用 flex 排列而不是绝对定位，尺寸变化时三条线的间距仍然成立。 */}
      <span className="h-px w-full rounded-full bg-background/80" />
      <span className="h-px w-full rounded-full bg-background/55" />
      <span className="h-px w-2/3 rounded-full bg-background/30" />
    </span>
  )
}

export { ProductMark }
