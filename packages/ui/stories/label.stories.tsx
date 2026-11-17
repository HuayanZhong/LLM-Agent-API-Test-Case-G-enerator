import type { Meta, StoryObj } from "@storybook/react-vite"

import { Input } from "../src/components/input"
import { Label } from "../src/components/label"

const meta = {
  title: "UI/Label",
  component: Label,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "表单标签，通过 htmlFor 与输入框关联，点击标签可聚焦对应控件。",
      },
    },
  },
} satisfies Meta<typeof Label>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  name: "默认",
  render: () => (
    <div className="grid w-64 gap-2">
      <Label htmlFor="story-label-account">账号</Label>
      <Input id="story-label-account" placeholder="请输入账号" />
    </div>
  ),
  parameters: {
    docs: { description: { story: "标签与输入框通过 htmlFor / id 关联。" } },
  },
}

export const Muted: Story = {
  name: "弱化",
  render: () => (
    <div className="grid w-64 gap-2">
      <Label htmlFor="story-label-remember" className="font-normal text-muted-foreground">
        记住账号
      </Label>
      <Input id="story-label-remember" placeholder="仅在本机保存账号" />
    </div>
  ),
  parameters: {
    docs: { description: { story: "弱化标签，适合辅助选项。" } },
  },
}
