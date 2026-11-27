"use client"

import * as React from "react"
import type { Ref } from "react"
import { Eye, EyeOff } from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"

interface PasswordFieldProps {
  id?: string
  name?: string
  label?: string
  value: string
  onChange: (value: string) => void
  error?: string
  disabled?: boolean
  autoComplete?: string
  inputRef?: Ref<HTMLInputElement>
}

/** 密码输入：显隐按钮只改变呈现方式，不修改输入值。 */
function PasswordField({
  id = "password",
  name = "password",
  label: labelProp,
  value,
  onChange,
  error,
  disabled,
  autoComplete = "current-password",
  inputRef,
}: PasswordFieldProps) {
  const t = useTranslations("fields")
  const [visible, setVisible] = React.useState(false)
  // 注册页用“设置密码”，登录页用默认“密码”；由调用方决定，组件不猜。
  const label = labelProp ?? t("password")

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          ref={inputRef}
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder={t("passwordPlaceholder")}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className="pr-10"
        />
        {/* 图标按钮必须显式 type="button"，否则会触发表单提交。 */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute top-0 right-0 size-8 text-muted-foreground hover:text-foreground"
          aria-label={visible ? t("hidePassword") : t("showPassword")}
          aria-pressed={visible}
          disabled={disabled}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </Button>
      </div>
      {error ? (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export { PasswordField }
