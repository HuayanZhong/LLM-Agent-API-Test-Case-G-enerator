import type { Meta, StoryObj } from "@storybook/react-vite"

import { Alert, AlertAction, AlertDescription, AlertTitle } from "../src/components/alert"

const meta = {
  title: "UI/Alert",
  component: Alert,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: "提示条，支持默认与危险两种语气，可组合标题、描述与操作区。",
      },
    },
  },
} satisfies Meta<typeof Alert>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  name: "默认",
  render: () => (
    <Alert className="max-w-md">
      <AlertTitle>演示模式</AlertTitle>
      <AlertDescription>认证服务尚未接入，提交只做前端校验。</AlertDescription>
    </Alert>
  ),
  parameters: {
    docs: { description: { story: "默认提示，用于说明当前模式或状态。" } },
  },
}

export const Destructive: Story = {
  name: "危险",
  render: (args) => (
    <Alert {...args} className="max-w-md">
      <AlertTitle>请检查登录信息</AlertTitle>
      <AlertDescription>账号或密码未通过校验，请按提示修改。</AlertDescription>
    </Alert>
  ),
  args: { variant: "destructive" },
  parameters: {
    docs: { description: { story: "危险语气，用于校验失败或不可逆操作提醒。" } },
  },
}

export const WithAction: Story = {
  name: "带操作",
  render: () => (
    <Alert className="max-w-md">
      <AlertTitle>构建完成</AlertTitle>
      <AlertDescription>测试报告已生成。</AlertDescription>
      <AlertAction>
        <button type="button" className="text-xs underline underline-offset-2">
          查看
        </button>
      </AlertAction>
    </Alert>
  ),
  parameters: {
    docs: { description: { story: "右侧操作区，可放查看、关闭等次要动作。" } },
  },
}
