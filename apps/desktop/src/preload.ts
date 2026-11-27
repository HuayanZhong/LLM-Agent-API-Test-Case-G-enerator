import { contextBridge, ipcRenderer } from "electron"
import type { DesktopBridge } from "@workspace/types"

import { TITLE_BAR_CHANNEL } from "./titlebar-contract"

// 沙箱 preload 只暴露静态信息与一条标题栏主题通道；后续需要 IPC 时逐个显式加白名单接口。
const versions = process.versions as NodeJS.ProcessVersions & {
  electron?: string
  chrome?: string
}

const bridge: DesktopBridge = {
  platform: process.platform,
  versions: {
    electron: versions.electron ?? "",
    chrome: versions.chrome ?? "",
    node: versions.node,
  },
  setTitleBarTheme: (theme) => {
    // 只传主题枚举；颜色与窗口配置留在主进程，避免渲染进程注入原生参数。
    ipcRenderer.send(TITLE_BAR_CHANNEL, theme)
  },
}

contextBridge.exposeInMainWorld("desktop", bridge)
