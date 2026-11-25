import type { Metadata } from "next"

import { DEFAULT_LOCALE, messages } from "@workspace/i18n"

import { RegisterForm } from "../_components/register-form"

// 静态导出的 metadata 只能是构建期常量；直接取默认语言词表，避免与文案包两处维护。
const { meta } = messages[DEFAULT_LOCALE]

export const metadata: Metadata = {
  title: meta.registerTitle,
  description: meta.registerDescription,
}

export default function RegisterPage() {
  return <RegisterForm />
}
