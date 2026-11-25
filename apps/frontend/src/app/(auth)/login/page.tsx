import type { Metadata } from "next"

import { DEFAULT_LOCALE, messages } from "@workspace/i18n"

import { LoginForm } from "../_components/login-form"

// 静态导出的 metadata 只能是构建期常量；直接取默认语言词表，避免与文案包两处维护。
const { meta } = messages[DEFAULT_LOCALE]

export const metadata: Metadata = {
  title: meta.loginTitle,
  description: meta.loginDescription,
}

export default function LoginPage() {
  return <LoginForm />
}
