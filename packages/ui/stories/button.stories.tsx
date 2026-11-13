import type { Meta, StoryObj } from "@storybook/react-vite"
import { fn } from "storybook/test"

import { Button } from "../src/components/button"

const meta = {
  title: "UI/Button",
  component: Button,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "基础按钮，支持 default / secondary / outline / ghost / destructive / link 与多种尺寸。",
      },
    },
  },
  args: {
    onClick: fn(),
  },
} satisfies Meta<typeof Button>

export default meta

type Story = StoryObj<typeof meta>

export const Primary: Story = {
  name: "主要",
  args: { children: "按钮" },
  parameters: {
    docs: { description: { story: "默认主按钮，用于页面主操作。" } },
  },
}

export const Secondary: Story = {
  name: "次要",
  args: { variant: "secondary", children: "次要" },
  parameters: {
    docs: { description: { story: "次要操作，视觉权重低于主按钮。" } },
  },
}

export const Outline: Story = {
  name: "描边",
  args: { variant: "outline", children: "描边" },
  parameters: {
    docs: { description: { story: "带边框的按钮，适合低强调操作。" } },
  },
}

export const Ghost: Story = {
  name: "幽灵",
  args: { variant: "ghost", children: "幽灵" },
  parameters: {
    docs: { description: { story: "无背景，只在悬停时出现底色。" } },
  },
}

export const Destructive: Story = {
  name: "危险",
  args: { variant: "destructive", children: "删除" },
  parameters: {
    docs: { description: { story: "危险操作，用于删除等不可逆动作。" } },
  },
}

export const Sizes: Story = {
  name: "尺寸",
  render: (args) => (
    <div className="flex items-center gap-2">
      <Button {...args} size="sm">
        小
      </Button>
      <Button {...args} size="default">
        默认
      </Button>
      <Button {...args} size="lg">
        大
      </Button>
    </div>
  ),
  parameters: {
    docs: { description: { story: "并排展示 sm / default / lg 三种尺寸。" } },
  },
}

export const Disabled: Story = {
  name: "禁用",
  args: { disabled: true, children: "禁用" },
  parameters: {
    docs: { description: { story: "禁用态，不响应点击。" } },
  },
}
