import type { ForgeConfig } from "@electron-forge/shared-types"
import { VitePlugin } from "@electron-forge/plugin-vite"
import { FusesPlugin } from "@electron-forge/plugin-fuses"
import { FuseV1Options, FuseVersion } from "@electron/fuses"

const config: ForgeConfig = {
  // Forge 默认会爬 node_modules；这里只保留运行需要的三个入口，避免把 devDependencies 带进 asar。
  // Vite 插件的默认 ignore 只保留 .vite，因此必须显式保留 renderer。
  packagerConfig: {
    name: "ApiTestAgent",
    executableName: "api-test-agent",
    asar: true,
    ignore: (file) => {
      if (!file) return false
      return !(
        file.startsWith("/.vite") ||
        file.startsWith("/renderer") ||
        file === "/package.json"
      )
    },
  },
  rebuildConfig: {},
  makers: [{ name: "@electron-forge/maker-zip", config: {} }],
  plugins: [
    new VitePlugin({
      // renderer 由 Next 静态导出提供，不交给 Vite；空数组是插件允许的配置。
      build: [
        { entry: "src/main.ts", config: "vite.main.config.mts", target: "main" },
        { entry: "src/preload.ts", config: "vite.preload.config.mts", target: "preload" },
      ],
      renderer: [],
    }),
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
}

export default config
