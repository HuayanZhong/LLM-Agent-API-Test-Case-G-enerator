# global-click-effect Specification

## Purpose

为全站点击交互提供统一的火花迸发视觉反馈:挂载于根布局、覆盖所有页面、不拦截任何交互、适配暗色 / 亮色双主题,提升前端交互质感。

## Requirements

### Requirement: 特效全站生效

点击特效 SHALL 挂载于前端根布局,登录、注册及后续新增页面上的任意鼠标点击 MUST 触发火花迸发;特效组件的接入 MUST NOT 需要各页面自行引入。

#### Scenario: 登录页点击触发火花

- **WHEN** 用户在登录页任意位置点击鼠标
- **THEN** 点击坐标处出现火花迸发动效,并在限定时长内消退

#### Scenario: 新页面自动继承特效

- **WHEN** 前端新增一个路由页面,页面自身未接入任何特效组件
- **THEN** 该页面上的点击同样触发火花迸发

### Requirement: 特效不拦截交互

特效层 MUST NOT 拦截、吞掉或延迟任何点击、悬停与键盘交互;被点击元素(按钮、输入框、链接)MUST 正常响应其自身行为。

#### Scenario: 点击按钮同时获得自身行为与火花

- **WHEN** 用户点击登录表单的提交按钮
- **THEN** 表单提交逻辑正常执行,同时出现火花迸发,两者互不影响

#### Scenario: 输入框聚焦不受特效影响

- **WHEN** 用户点击输入框准备输入
- **THEN** 输入框正常获得焦点,可立即输入

### Requirement: 默认参数与可覆盖性

特效适配层 SHALL 提供默认动效参数(火花数量、尺寸、半径、时长、形态、缓动等),调用方 MUST 能够通过 props 覆盖任意一项默认值;默认参数集合 SHALL 包含 sparkCount=9、sparkSize=8、sparkRadius=14、duration=350、sparkWidth=1.5、randomness=0.05、preset 彗星(comet)风格、spring 缓动、ring 与 glow 开启、star 星形火花。

#### Scenario: 默认参数开箱即用

- **WHEN** 适配层未传任何 props 挂载于根布局
- **THEN** 点击火花以上述默认参数呈现

#### Scenario: 调用方覆盖单项默认

- **WHEN** 调用方通过 props 显式传入不同的火花数量
- **THEN** 实际生效的是传入值,其余未传入项保持默认

### Requirement: 火花适配双主题

火花颜色 SHALL 由主题令牌解析得出,暗色与亮色主题下 MUST 均清晰可见;主题切换时 MUST 使用新主题对应的颜色,无需页面刷新。

#### Scenario: 亮色主题下火花可见

- **WHEN** 前端处于亮色主题,用户点击页面
- **THEN** 火花以亮色主题下清晰可辨的颜色呈现

#### Scenario: 主题切换后颜色跟随

- **WHEN** 用户在暗色主题下切换到亮色主题后继续点击
- **THEN** 新产生的火花使用亮色主题的颜色,不出现亮色背景下不可见的白色火花

### Requirement: 减少动态偏好下降低动效

当用户系统开启 prefers-reduced-motion(减少动态)时,特效 SHALL 显著降低动效强度(时长与幅度),而不是完全禁用或照常全量播放。

#### Scenario: 系统偏好减少动态时点击

- **WHEN** 用户系统开启减少动态偏好后点击页面
- **THEN** 火花以短促低幅度的形式呈现,不再全量播放
