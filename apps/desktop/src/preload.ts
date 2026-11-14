import { contextBridge } from "electron"

// 沙箱 preload 只暴露静态信息；后续需要 IPC 时逐个显式加白名单接口，不暴露通用通道。
const versions = process.versions as NodeJS.ProcessVersions & {
  electron?: string
  chrome?: string
}

contextBridge.exposeInMainWorld("desktop", {
  platform: process.platform,
  versions: {
    electron: versions.electron ?? "",
    chrome: versions.chrome ?? "",
    node: versions.node,
  },
})
