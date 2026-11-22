"use client"

import * as React from "react"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Label } from "@workspace/ui/components/label"

import { useRememberedEmail } from "../_hooks/use-remembered-email"
import { SUBMIT_DELAY_MS } from "../_lib/auth-constants"
import { validateLogin, type AuthErrors } from "../_lib/validate-auth"
import { EmailField } from "./email-field"
import { PasswordField } from "./password-field"

// 提交态只有三档：idle 可提交、submitting 锁按钮、success 已完成演示提交。
type SubmitStatus = "idle" | "submitting" | "success"

function LoginForm() {
  // 密码只存在组件内存；邮箱与“记住邮箱”由 useRememberedEmail 管理。
  const [password, setPassword] = React.useState("")
  const [errors, setErrors] = React.useState<AuthErrors>({})
  const [submitted, setSubmitted] = React.useState(false)
  const [status, setStatus] = React.useState<SubmitStatus>("idle")

  // refs 用于校验失败后把焦点移到第一个错误字段。
  const emailRef = React.useRef<HTMLInputElement>(null)
  const passwordRef = React.useRef<HTMLInputElement>(null)
  // 演示提交的定时器；卸载时要主动清理，避免对已卸载组件 setState。
  const timerRef = React.useRef<number | null>(null)

  const {
    email,
    remember,
    setEmail,
    setRemember,
    save: saveRememberedEmail,
    clear: clearRememberedEmail,
  } = useRememberedEmail()

  React.useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current)
      }
    }
  }, [])

  function revalidate(nextEmail: string, nextPassword: string) {
    // 首次提交前不显示错误，避免用户还没操作就被红字打断；提交后再随输入实时修正。
    if (!submitted) {
      return
    }

    setErrors(validateLogin({ email: nextEmail, password: nextPassword }))
  }

  function handleEmailChange(value: string) {
    setEmail(value)
    revalidate(value, password)
  }

  function handlePasswordChange(value: string) {
    setPassword(value)
    revalidate(email, value)
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    // 表单使用 noValidate，原生校验提示会与自定义错误重复，统一由 validateLogin 负责。
    event.preventDefault()

    // 提交中锁住重复提交，和按钮 disabled 形成双保险。
    if (status === "submitting") {
      return
    }

    if (status === "success") {
      setStatus("idle")
    }

    const nextErrors = validateLogin({ email, password })
    setErrors(nextErrors)
    setSubmitted(true)

    if (nextErrors.email || nextErrors.password) {
      // 把焦点送到第一个错误字段，键盘用户不用再手动找。
      if (nextErrors.email) {
        emailRef.current?.focus()
      } else {
        passwordRef.current?.focus()
      }

      // 表单级错误用 Toast 汇总；字段级错误仍留在输入框下方。
      toast.error("请检查登录信息", {
        description: "邮箱或密码未通过校验，请按提示修改。",
      })
      return
    }

    // 只保存邮箱；未勾选时清除旧邮箱，避免下次打开仍被预填。
    if (remember) {
      saveRememberedEmail(email)
    } else {
      clearRememberedEmail()
    }

    // 本期没有认证服务：用固定延时模拟请求，再以 Toast 给出演示结果。
    setStatus("submitting")
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null
      setStatus("success")
      toast.success("表单校验通过", {
        description: "认证服务尚未接入；接入后会进入工作台。",
      })
    }, SUBMIT_DELAY_MS)
  }

  return (
    <div className="w-full">
      {/* 主题切换按钮由 auth layout 固定在页面右上角，表单这里不再重复。 */}
      <div className="mb-8">
        <h1 className="font-title text-2xl leading-tight tracking-tight sm:text-3xl">登录工作台</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">使用邮箱登录。</p>
      </div>

      {/* noValidate 关闭浏览器原生校验，保持错误文案和焦点顺序由前端统一控制。 */}
      <form
        aria-label="登录表单"
        noValidate
        onSubmit={handleSubmit}
        className="space-y-4 sm:space-y-5"
      >
        <EmailField
          id="login-email"
          value={email}
          onChange={handleEmailChange}
          error={errors.email}
          inputRef={emailRef}
        />

        <PasswordField
          id="login-password"
          value={password}
          onChange={handlePasswordChange}
          error={errors.password}
          inputRef={passwordRef}
        />

        {/* 记住邮箱与注册入口同一行：左侧选项，右侧次要导航；窄屏允许换行。 */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="remember-email"
              aria-label="记住邮箱"
              checked={remember}
              onCheckedChange={(checked) => {
                const nextRemember = checked === true
                setRemember(nextRemember)
                if (!nextRemember) {
                  // 取消勾选立即清除本地邮箱；先把当前值固定在输入框里，避免输入被一起清空。
                  setEmail(email)
                  clearRememberedEmail()
                }
              }}
            />
            <Label htmlFor="remember-email" className="font-normal text-muted-foreground">
              记住邮箱
            </Label>
          </div>
          <p className="text-sm text-muted-foreground">
            还没有账号？{" "}
            <Link
              href="/register/"
              className="font-medium text-foreground underline underline-offset-4 hover:text-foreground/80"
            >
              去注册
            </Link>
          </p>
        </div>

        {/* 提交中禁用按钮，和 handleSubmit 的 submitting 守卫形成双保险。 */}
        <Button type="submit" className="w-full" disabled={status === "submitting"}>
          {status === "submitting" ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              正在登录…
            </>
          ) : (
            "登录"
          )}
        </Button>
      </form>

      {/* 常驻说明当前是演示模式，避免把前端校验误认为真实登录。 */}
      <p className="mt-4 text-xs leading-5 text-muted-foreground">
        演示模式：认证服务尚未接入，提交只做前端校验。
      </p>
    </div>
  )
}

export { LoginForm }
