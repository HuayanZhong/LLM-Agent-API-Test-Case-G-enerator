import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  transpilePackages: ["@workspace/ui", "@workspace/i18n"],
  // 桌面端生产包由 Electron 托管静态文件；Next 服务端能力不在桌面形态内。
  output: "export",
  // 让每个路由输出 foo/index.html，Electron 的 app:// 解析与刷新行为可预测。
  trailingSlash: true,
  // 静态导出没有服务端图片优化器，提前禁用默认 loader，避免后续页面踩坑。
  images: { unoptimized: true },
}

export default nextConfig
