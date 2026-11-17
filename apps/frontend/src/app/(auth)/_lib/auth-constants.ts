/** 登录 / 注册共享常量：校验长度、演示延时、验证码冷却与本地邮箱键集中在这里。 */

/** 密码最小长度；校验规则与错误文案共用，避免两处漂移。 */
export const MIN_PASSWORD_LENGTH = 6

/** 邮箱验证码固定 6 位数字。 */
export const VERIFICATION_CODE_LENGTH = 6

/** 演示提交的 loading 时长；接入真实认证后删除。 */
export const SUBMIT_DELAY_MS = 600

/** 发送验证码后的冷却秒数，避免演示时连续点击。 */
export const CODE_RESEND_SECONDS = 60

/** 只保存邮箱，不保存密码；键名带命名空间，避免与其他本地数据冲突。 */
export const REMEMBERED_EMAIL_KEY = "interface-test-agent:last-email"

/** 轨道编号补零到两位，保持 01–04 的视觉节奏。 */
export const STEP_INDEX_WIDTH = 2
