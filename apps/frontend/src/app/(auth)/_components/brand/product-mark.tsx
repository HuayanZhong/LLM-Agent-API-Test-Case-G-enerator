import { cn } from "@workspace/ui/lib/utils"

/**
 * 产品几何标记：三条横线代表请求、比对与报告。
 * 半透明的底片让标记保留轮廓、又轻于标题，避免纯色方块抢走第一眼。
 */
function ProductMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-9 shrink-0 flex-col justify-center gap-1.5 rounded-lg bg-foreground/10 px-2.5",
        className,
      )}
    >
      {/* 用 flex 排列而不是绝对定位，尺寸变化时三条线的间距仍然成立。 */}
      <span className="h-0.5 w-full rounded-full bg-foreground/90" />
      <span className="h-0.5 w-full rounded-full bg-foreground/65" />
      <span className="h-0.5 w-2/3 rounded-full bg-foreground/40" />
    </span>
  )
}

export { ProductMark }
