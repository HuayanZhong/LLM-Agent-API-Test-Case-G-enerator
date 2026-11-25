"use client"

import { useTranslations } from "next-intl"

import { cn } from "@workspace/ui/lib/utils"

import { ProductMark } from "./product-mark"

interface ProductMastheadProps {
  /** 外层容器样式；左右栏与移动端各自控制间距。 */
  className?: string
  /** 标记尺寸；各断点不同，由调用方传入。 */
  markClassName?: string
}

/** 产品标识与名称：桌面左栏与移动端共用一份，避免两处文案与比例漂移。 */
function ProductMasthead({ className, markClassName }: ProductMastheadProps) {
  const t = useTranslations("common")

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <ProductMark className={markClassName} />
      <div className="min-w-0">
        <p className="text-sm leading-tight font-semibold tracking-tight xl:text-base">
          {t("productName")}
        </p>
        <p className="mt-1 text-xs leading-none tracking-widest text-muted-foreground">
          {t("productTagline")}
        </p>
      </div>
    </div>
  )
}

export { ProductMasthead }
