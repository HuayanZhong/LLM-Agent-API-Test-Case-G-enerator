"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function Page() {
  const router = useRouter()

  // 工作台尚未实现：根路径先进入登录页；工作台就位后这里改为工作台并加未认证守卫。
  useEffect(() => {
    router.replace("/login/")
  }, [router])

  return null
}
