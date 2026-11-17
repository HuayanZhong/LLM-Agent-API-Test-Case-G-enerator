import type { Metadata } from "next"

import { RegisterForm } from "../_components/register-form"

export const metadata: Metadata = {
  title: "注册 · 接口测试用例辅助生成系统",
  description: "使用邮箱验证码创建账号。",
}

export default function RegisterPage() {
  return <RegisterForm />
}
