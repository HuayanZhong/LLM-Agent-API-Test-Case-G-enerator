# Spec Delta

## ADDED Requirements

### Requirement: 主窗口尺寸约束

桌面壳 SHALL 以 1280×800 作为主窗口初始尺寸，并 MUST 限制窗口不能被缩到小于 1024×800，避免前端内容被压缩到不可操作。

#### Scenario: 默认尺寸启动

- **WHEN** 应用启动并创建主窗口
- **THEN** 主窗口初始宽度为 1280、高度为 800

#### Scenario: 缩放到最小尺寸

- **WHEN** 用户持续拖动窗口边缘缩小主窗口
- **THEN** 窗口宽度不小于 1024、高度不小于 800

### Requirement: 隐藏默认应用菜单

Windows 平台上的桌面壳 SHALL 移除 Electron 默认应用菜单，MUST NOT 在窗口上显示 File / Edit / View / Window / Help 菜单栏。

#### Scenario: 启动后没有菜单栏

- **WHEN** 应用启动完成并显示主窗口
- **THEN** 窗口顶部不显示应用菜单栏，也没有可通过 Alt 唤出的菜单

### Requirement: 开发态快捷键打开 DevTools

未打包运行时，桌面壳 SHALL 绑定 F12 与 Ctrl+Shift+I 用于切换主窗口 DevTools，MUST NOT 在启动时自动打开；打包运行时 MUST NOT 注册该快捷键，也不自动打开 DevTools。

#### Scenario: 开发态按 F12 打开

- **WHEN** 以未打包模式启动桌面壳，用户在主窗口按下 F12
- **THEN** DevTools 打开，再次按下 F12 则关闭

#### Scenario: 开发态按 Ctrl+Shift+I 打开

- **WHEN** 以未打包模式启动桌面壳，用户在主窗口按下 Ctrl+Shift+I
- **THEN** DevTools 切换为打开或关闭状态

#### Scenario: 打包态不打开

- **WHEN** 启动打包产物
- **THEN** DevTools 不自动打开，F12 与 Ctrl+Shift+I 也不会打开 DevTools
