import type { Ref } from "react"

import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"

interface EmailFieldProps {
  id?: string
  value: string
  onChange: (value: string) => void
  error?: string
  disabled?: boolean
  inputRef?: Ref<HTMLInputElement>
}

/** 邮箱输入：浏览器密码管理器可识别；错误通过 aria-describedby 关联到输入框。 */
function EmailField({ id = "email", value, onChange, error, disabled, inputRef }: EmailFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>邮箱</Label>
      <Input
        ref={inputRef}
        id={id}
        name="email"
        type="email"
        autoComplete="email"
        placeholder="请输入邮箱"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error ? (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export { EmailField }
