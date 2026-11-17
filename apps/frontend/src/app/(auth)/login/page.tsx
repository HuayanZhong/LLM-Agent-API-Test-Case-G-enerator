import type { Metadata } from "next"

import { LoginForm } from "../_components/login-form"

export const metadata: Metadata = {
  title: "登录 · 接口测试用例辅助生成系统",
  description: "使用邮箱登录工作台，管理接口测试用例与复验。",
}

export default function LoginPage() {
  return <LoginForm />
}
