"use client"

import { useTranslations } from "next-intl"

import { MIN_PASSWORD_LENGTH, VERIFICATION_CODE_LENGTH } from "../_lib/auth-constants"
import type { AuthErrorKey } from "../_lib/validate-auth"

/**
 * 把校验键翻译成当前语言；插值参数集中在这里，表单不需要知道文案细节。
 */
function useAuthErrorMessage() {
  const t = useTranslations("auth.errors")

  return (key: AuthErrorKey | undefined) => {
    if (!key) {
      return undefined
    }
    if (key === "passwordMin") {
      return t("passwordMin", { min: MIN_PASSWORD_LENGTH })
    }
    if (key === "codeFormat") {
      return t("codeFormat", { length: VERIFICATION_CODE_LENGTH })
    }
    return t(key)
  }
}

export { useAuthErrorMessage }
