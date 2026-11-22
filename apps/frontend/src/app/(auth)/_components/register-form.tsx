"use client"

import * as React from "react"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@workspace/ui/components/button"

import { CODE_RESEND_SECONDS, SUBMIT_DELAY_MS } from "../_lib/auth-constants"
import { validateEmail, validateRegister, type AuthErrors } from "../_lib/validate-auth"
import { CodeField } from "./code-field"
import { EmailField } from "./email-field"
import { PasswordField } from "./password-field"

type SubmitStatus = "idle" | "submitting" | "success"

function RegisterForm() {
  const [email, setEmail] = React.useState("")
  const [code, setCode] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [codeSent, setCodeSent] = React.useState(false)
  const [resendIn, setResendIn] = React.useState(0)
  const [errors, setErrors] = React.useState<AuthErrors>({})
  const [submitted, setSubmitted] = React.useState(false)
  const [status, setStatus] = React.useState<SubmitStatus>("idle")

  const emailRef = React.useRef<HTMLInputElement>(null)
  const codeRef = React.useRef<HTMLInputElement>(null)
  const passwordRef = React.useRef<HTMLInputElement>(null)
  const submitTimerRef = React.useRef<number | null>(null)

  // 演示阶段没有真实发信接口；倒计时只用于展示“已发送、稍后可重发”的状态。
  React.useEffect(() => {
    if (resendIn <= 0) {
      return
    }

    const interval = window.setInterval(() => {
      setResendIn((current) => (current <= 1 ? 0 : current - 1))
    }, 1000)

    return () => window.clearInterval(interval)
  }, [resendIn])

  React.useEffect(() => {
    return () => {
      if (submitTimerRef.current !== null) {
        window.clearTimeout(submitTimerRef.current)
      }
    }
  }, [])

  function buildErrors(
    nextEmail: string,
    nextCode: string,
    nextPassword: string,
    nextCodeSent: boolean,
  ) {
    const nextErrors = validateRegister({
      email: nextEmail,
      code: nextCode,
      password: nextPassword,
    })

    // 格式错误优先：只有验证码已是合法 6 位数字、却还没点发送时，才提示“请先获取验证码”。
    // 否则输入 12345 也会看到前置条件提示，规格里的验证码格式错误场景就不可达。
    if (!nextCodeSent && !nextErrors.code) {
      nextErrors.code = "请先获取验证码"
    }

    return nextErrors
  }

  function revalidate(
    nextEmail: string,
    nextCode: string,
    nextPassword: string,
    nextCodeSent: boolean,
  ) {
    if (!submitted) {
      return
    }

    setErrors(buildErrors(nextEmail, nextCode, nextPassword, nextCodeSent))
  }

  function handleEmailChange(value: string) {
    setEmail(value)
    // 改邮箱后旧验证码失效，清零发送状态与冷却时间。
    if (codeSent) {
      setCodeSent(false)
      setCode("")
      setResendIn(0)
    }
    // 重新校验必须用 nextCodeSent=false 和清空后的验证码，不能读本次渲染的旧闭包值。
    revalidate(value, codeSent ? "" : code, password, false)
  }

  function handleCodeChange(value: string) {
    setCode(value)
    revalidate(email, value, password, codeSent)
  }

  function handlePasswordChange(value: string) {
    setPassword(value)
    revalidate(email, code, value, codeSent)
  }

  function handleSendCode() {
    const emailError = validateEmail(email)
    if (emailError) {
      setErrors((current) => ({ ...current, email: emailError }))
      setSubmitted(true)
      emailRef.current?.focus()
      toast.error("请先填写有效邮箱", { description: emailError })
      return
    }

    setCodeSent(true)
    setResendIn(CODE_RESEND_SECONDS)
    setErrors((current) => ({
      ...current,
      email: undefined,
      // 发送成功后“请先获取验证码”已经失效；格式错误仍然有效，保留。
      code: current.code === "请先获取验证码" ? undefined : current.code,
    }))
    toast.success("验证码已发送（演示）", {
      description: "演示模式不会真正发送邮件，请输入任意 6 位数字继续。",
    })
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (status === "submitting") {
      return
    }

    if (status === "success") {
      setStatus("idle")
    }

    const nextErrors = buildErrors(email, code, password, codeSent)
    setErrors(nextErrors)
    setSubmitted(true)

    if (nextErrors.email || nextErrors.code || nextErrors.password) {
      // 焦点顺序跟随视觉顺序（邮箱 → 密码 → 验证码），避免跳到后面的字段再退回来。
      if (nextErrors.email) {
        emailRef.current?.focus()
      } else if (nextErrors.password) {
        passwordRef.current?.focus()
      } else {
        codeRef.current?.focus()
      }

      toast.error("请检查注册信息", {
        description: "邮箱、验证码或密码未通过校验，请按提示修改。",
      })
      return
    }

    setStatus("submitting")
    submitTimerRef.current = window.setTimeout(() => {
      submitTimerRef.current = null
      setStatus("success")
      toast.success("注册演示完成", {
        description: "Supabase 邮箱验证码流程尚未接入，不会创建真实账号。",
      })
    }, SUBMIT_DELAY_MS)
  }

  const sendLabel = resendIn > 0 ? `${resendIn}s 后重发` : "发送验证码"

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="font-title text-2xl leading-tight tracking-tight sm:text-3xl">注册工作台</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">使用邮箱验证码创建账号。</p>
      </div>

      <form
        aria-label="注册表单"
        noValidate
        onSubmit={handleSubmit}
        className="space-y-4 sm:space-y-5"
      >
        <EmailField
          id="register-email"
          value={email}
          onChange={handleEmailChange}
          error={errors.email}
          inputRef={emailRef}
        />

        <PasswordField
          id="register-password"
          name="new-password"
          label="设置密码"
          value={password}
          onChange={handlePasswordChange}
          error={errors.password}
          autoComplete="new-password"
          inputRef={passwordRef}
        />

        <CodeField
          id="register-code"
          value={code}
          onChange={handleCodeChange}
          error={errors.code}
          onSend={handleSendCode}
          sendLabel={sendLabel}
          sendDisabled={resendIn > 0 || status === "submitting"}
          inputRef={codeRef}
        />

        <Button type="submit" className="w-full" disabled={status === "submitting"}>
          {status === "submitting" ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              正在注册…
            </>
          ) : (
            "注册"
          )}
        </Button>
      </form>

      <p className="mt-5 text-sm text-muted-foreground">
        已有账号？{" "}
        <Link
          href="/login/"
          className="font-medium text-foreground underline underline-offset-4 hover:text-foreground/80"
        >
          返回登录
        </Link>
      </p>

      {/* 常驻说明当前是演示模式，避免把前端校验误认为真实注册。 */}
      <p className="mt-4 text-xs leading-5 text-muted-foreground">
        演示模式：不会真正发送邮件，也不会创建账号。
      </p>
    </div>
  )
}

export { RegisterForm }
