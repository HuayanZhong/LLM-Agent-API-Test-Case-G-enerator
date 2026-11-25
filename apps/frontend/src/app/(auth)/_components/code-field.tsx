"use client"

import { Fragment, type Ref } from "react"
import { useTranslations } from "next-intl"

import { Button } from "@workspace/ui/components/button"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@workspace/ui/components/input-otp"
import { Label } from "@workspace/ui/components/label"

import { VERIFICATION_CODE_LENGTH } from "../_lib/auth-constants"

const OTP_GROUP_COUNT = 3
const OTP_GROUP_SIZE = VERIFICATION_CODE_LENGTH / OTP_GROUP_COUNT

interface CodeFieldProps {
  id?: string
  value: string
  onChange: (value: string) => void
  error?: string
  onSend: () => void
  sendLabel: string
  sendDisabled?: boolean
  disabled?: boolean
  inputRef?: Ref<HTMLInputElement>
}

/** 邮箱验证码输入：使用 shadcn Input OTP；发送按钮只触发演示流程，不会真正发信。 */
function CodeField({
  id = "code",
  value,
  onChange,
  error,
  onSend,
  sendLabel,
  sendDisabled,
  disabled,
  inputRef,
}: CodeFieldProps) {
  const t = useTranslations("fields")

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{t("code")}</Label>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <InputOTP
          id={id}
          ref={inputRef}
          maxLength={VERIFICATION_CODE_LENGTH}
          /* input-otp 对整串值做 RegExp.test；必须锚定，否则 [0-9]* 会匹配任意字符。 */
          pattern="^[0-9]*$"
          value={value}
          onChange={onChange}
          disabled={disabled}
          aria-label={t("code")}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          containerClassName={
            error ? "min-w-0 flex-1 rounded-lg ring-3 ring-destructive/20" : "min-w-0 flex-1"
          }
        >
          {Array.from({ length: OTP_GROUP_COUNT }).map((_, groupIndex) => {
            const startIndex = groupIndex * OTP_GROUP_SIZE

            return (
              <Fragment key={groupIndex}>
                {groupIndex > 0 ? <InputOTPSeparator /> : null}
                <InputOTPGroup className="flex-1">
                  {Array.from({ length: OTP_GROUP_SIZE }).map((_, slotIndex) => {
                    const index = startIndex + slotIndex

                    return <InputOTPSlot key={index} index={index} className="h-8 flex-1" />
                  })}
                </InputOTPGroup>
              </Fragment>
            )
          })}
        </InputOTP>
        <Button
          type="button"
          variant="outline"
          onClick={onSend}
          disabled={sendDisabled || disabled}
          className="w-full shrink-0 sm:w-auto"
        >
          {sendLabel}
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

export { CodeField }
