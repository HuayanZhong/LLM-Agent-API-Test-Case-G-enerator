import { app, protocol } from "electron"
import { APP_SCHEME } from "./protocol/protocol"
import { bootstrap } from "./app/bootstrap"

// 必须在 app ready 之前注册；standard/secure 让 app:// 拥有 origin、相对路径与存储 API。
protocol.registerSchemesAsPrivileged([
  {
    scheme: APP_SCHEME,
    privileges: { standard: true, secure: true, supportFetchAPI: true },
  },
])

bootstrap().catch((error) => {
  console.error("桌面壳启动失败", error)
  app.quit()
})
