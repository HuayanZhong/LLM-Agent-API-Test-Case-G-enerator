"use client"

import { ChevronDown, Globe } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { LOCALES, LOCALE_META, isLocale } from "@workspace/i18n"

import { useLocalePreference } from "./locale-provider"

/**
 * 语言切换入口：下拉菜单而不是分段按钮，方便后续增加语言或移入设置页。
 * 选中项由 Radix 的 RadioGroup 维护，键盘与读屏可直接操作。
 */
function LocaleToggle() {
  const locale = useLocale()
  const t = useTranslations("common")
  const { setLocale } = useLocalePreference()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="default"
          aria-label={`${t("switchLanguage")}: ${LOCALE_META[locale].name}`}
          className="group h-8 gap-1 px-2 font-label text-xs tracking-wider text-foreground/80 hover:text-foreground"
        >
          <Globe className="size-4 text-muted-foreground" aria-hidden="true" />
          <span>{LOCALE_META[locale].short}</span>
          <ChevronDown
            className="size-3.5 text-muted-foreground transition-transform duration-150 group-data-[state=open]:rotate-180"
            aria-hidden="true"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-36">
        <DropdownMenuRadioGroup
          value={locale}
          onValueChange={(value) => {
            // 菜单值来自 DOM，仍按不可信输入处理；未知语言不写入偏好。
            if (isLocale(value)) {
              setLocale(value)
            }
          }}
        >
          {LOCALES.map((value) => (
            <DropdownMenuRadioItem
              key={value}
              value={value}
              className="py-2 data-[state=checked]:bg-accent/60 data-[state=checked]:font-medium"
            >
              {LOCALE_META[value].name}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { LocaleToggle }
