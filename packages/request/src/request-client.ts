// 单文件自包含:Node 直接加载本包源码时,相对 import 的无扩展名说明符无法解析到 .ts,
// 显式 .ts 扩展名又会被未开 allowImportingTsExtensions 的消费方 tsc 拒绝——
// 与 @workspace/config / @workspace/vitest-config 同约定:一个域一个自包含文件。
// 新增配置域(Node preset 等)时另起自包含文件,并在 package.json exports 暴露。

// 与 @workspace/config 同一边界:包内不读环境变量、不加载 .env。
// baseURL 必须由调用方传入——NEXT_PUBLIC_* 只有在前端代码里以字面量引用
// 才会被 Next 内联,包里读 process.env 在打包后拿到的是 undefined。
import ky, { type KyInstance, type Options } from "ky"

// re-export ky 2 原生错误类(值导出,支持 instanceof 分流):
// HTTPError 携带预解析的 error.data,NetworkError / TimeoutError 覆盖网络层与超时失败
export { HTTPError, NetworkError, TimeoutError } from "ky"

export type { KyInstance, Options } from "ky"

/** 公开导出仅三类:实例工厂、浏览器 preset、错误类型;不含任何业务端点函数。 */

/** 实例工厂入参:baseURL 必填,其余选项原样透传 ky.create。 */
export type CreateRequestClientOptions = { baseURL: string } & Omit<
  Options,
  // prefix / baseUrl 由 baseURL 统一决定,不允许调用方另设造成双前缀
  "prefix" | "baseUrl"
>

/** 创建阶段校验 baseURL;错误配置延迟到首次请求才暴露会散播到每个调用点。 */
function assertBaseUrl(baseURL: unknown): asserts baseURL is string {
  if (typeof baseURL !== "string" || baseURL.trim() === "") {
    throw new TypeError("baseURL 校验失败:必须是非空字符串")
  }
  let parsed: URL
  try {
    parsed = new URL(baseURL)
  } catch {
    throw new TypeError(`baseURL 校验失败:不是合法 URL(${baseURL})`)
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new TypeError(`baseURL 校验失败:仅支持 http/https(${baseURL})`)
  }
}

/**
 * 创建环境无关的请求实例。
 *
 * @param options - baseURL 必填(非空 http/https URL),其余 ky Options 透传
 * @returns ky 实例;请求地址 = baseURL 前缀拼接相对路径
 * @throws {TypeError} baseURL 缺失、空串、非法 URL 或非 http/https 时创建即抛错
 */
export function createRequestClient(options: CreateRequestClientOptions): KyInstance {
  const { baseURL, ...kyOptions } = options
  assertBaseUrl(baseURL)
  // 用 prefix 而非 baseUrl:prefix 是拼接语义,baseURL 带路径段(如 /api/v1)时,
  // 以 / 开头的 input 不会被标准 URL 解析剥掉已有路径
  return ky.create({ prefix: baseURL, ...kyOptions })
}

/** 默认超时 10s:覆盖常规接口往返,避免长尾请求拖死 UI;调用方可显式覆盖。 */
const DEFAULT_TIMEOUT_MS = 10_000

/** 浏览器 preset 入参:baseURL 必填,其余选项在默认值之上覆盖。 */
export type BrowserRequestClientOptions = { baseURL: string } & Omit<
  Options,
  // 与核心工厂一致:地址语义由 baseURL 决定
  "prefix" | "baseUrl"
>

/**
 * 创建浏览器端请求实例(预置 JSON 头与默认超时),面向前端消费 BFF。
 * Node 端(BFF→backend)后续另起自包含 preset 文件,复用 createRequestClient。
 *
 * @param options - baseURL 必填;timeout / headers / hooks 等显式传入时覆盖 preset 默认
 * @returns ky 实例
 * @throws {TypeError} baseURL 校验失败时创建即抛错
 */
export function createBrowserRequestClient(options: BrowserRequestClientOptions): KyInstance {
  const { baseURL, timeout = DEFAULT_TIMEOUT_MS, headers, ...rest } = options
  return createRequestClient({
    baseURL,
    timeout,
    // 预置 JSON 头;调用方传入的 headers 覆盖同名默认值
    headers: { "content-type": "application/json", ...headers },
    ...rest,
  })
}
