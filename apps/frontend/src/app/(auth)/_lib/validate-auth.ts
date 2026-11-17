import { MIN_PASSWORD_LENGTH, VERIFICATION_CODE_LENGTH } from "./auth-constants"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type AuthField = "email" | "password" | "code"

export type AuthErrors = Partial<Record<AuthField, string>>

interface LoginInput {
  email: string
  password: string
}

interface RegisterInput {
  email: string
  password: string
  code: string
}

/** 邮箱只做格式检查，不判断是否已注册；真实认证接入后再由服务端返回结果。 */
export function validateEmail(email: string): string | undefined {
  const trimmed = email.trim()
  if (!trimmed) {
    return "请输入邮箱"
  }
  if (!EMAIL_PATTERN.test(trimmed)) {
    return "请输入有效邮箱"
  }
  return undefined
}

/** 纯空白密码视为未填写；长度按原值计算，保留密码中间的空格。 */
function validatePasswordField(password: string): string | undefined {
  if (!password.trim()) {
    return "请输入密码"
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `密码至少 ${MIN_PASSWORD_LENGTH} 位`
  }
  return undefined
}

/** 验证码必须是固定长度的纯数字；演示阶段不校验服务端是否已发送。 */
function validateCodeField(code: string): string | undefined {
  if (!code.trim()) {
    return "请输入验证码"
  }
  if (code.length !== VERIFICATION_CODE_LENGTH || !/^\d+$/.test(code)) {
    return `请输入 ${VERIFICATION_CODE_LENGTH} 位数字验证码`
  }
  return undefined
}

export function validateLogin({ email, password }: LoginInput): AuthErrors {
  const errors: AuthErrors = {}
  const emailError = validateEmail(email)
  if (emailError) {
    errors.email = emailError
  }
  const passwordError = validatePasswordField(password)
  if (passwordError) {
    errors.password = passwordError
  }
  return errors
}

export function validateRegister({ email, password, code }: RegisterInput): AuthErrors {
  const errors: AuthErrors = {}
  const emailError = validateEmail(email)
  if (emailError) {
    errors.email = emailError
  }
  const codeError = validateCodeField(code)
  if (codeError) {
    errors.code = codeError
  }
  const passwordError = validatePasswordField(password)
  if (passwordError) {
    errors.password = passwordError
  }
  return errors
}
