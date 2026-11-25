import { MIN_PASSWORD_LENGTH, VERIFICATION_CODE_LENGTH } from "./auth-constants"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type AuthField = "email" | "password" | "code"

/**
 * 校验只产出错误键：文案在展示层按当前语言解析，英文与中文共享同一组语义。
 * 插值参数（密码长度、验证码位数）由展示层传入，不写进键本身。
 */
export type AuthErrorKey =
  | "emailRequired"
  | "emailInvalid"
  | "passwordRequired"
  | "passwordMin"
  | "codeRequired"
  | "codeFormat"
  | "codeNotSent"

export type AuthErrors = Partial<Record<AuthField, AuthErrorKey>>

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
export function validateEmail(email: string): AuthErrorKey | undefined {
  const trimmed = email.trim()
  if (!trimmed) {
    return "emailRequired"
  }
  if (!EMAIL_PATTERN.test(trimmed)) {
    return "emailInvalid"
  }
  return undefined
}

/** 纯空白密码视为未填写；长度按原值计算，保留密码中间的空格。 */
function validatePasswordField(password: string): AuthErrorKey | undefined {
  if (!password.trim()) {
    return "passwordRequired"
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return "passwordMin"
  }
  return undefined
}

/** 验证码必须是固定长度的纯数字；演示阶段不校验服务端是否已发送。 */
function validateCodeField(code: string): AuthErrorKey | undefined {
  if (!code.trim()) {
    return "codeRequired"
  }
  if (code.length !== VERIFICATION_CODE_LENGTH || !/^\d+$/.test(code)) {
    return "codeFormat"
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
