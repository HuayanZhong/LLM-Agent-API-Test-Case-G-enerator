/** Nest 服务健康检查的只读响应形状；控制器只标注返回值，值仍在应用内构造。 */
export interface HealthResponse {
  status: "ok"
  service: string
}
