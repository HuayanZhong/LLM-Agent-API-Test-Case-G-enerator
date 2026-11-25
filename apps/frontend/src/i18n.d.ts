import type { Locale, Messages } from "@workspace/i18n"

// next-intl 的类型扩充入口：让 useTranslations 的键与 useLocale 的返回值参与类型检查。
declare module "next-intl" {
  interface AppConfig {
    Locale: Locale
    Messages: Messages
  }
}
