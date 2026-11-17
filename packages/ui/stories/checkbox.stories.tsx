import type { Meta, StoryObj } from "@storybook/react-vite"

import { Checkbox } from "../src/components/checkbox"
import { Label } from "../src/components/label"

const meta = {
  title: "UI/Checkbox",
  component: Checkbox,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "复选框，支持选中、禁用与 onCheckedChange；可与 Label 组合使用。",
      },
    },
  },
  args: {
    "aria-label": "记住账号",
  },
} satisfies Meta<typeof Checkbox>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  name: "默认",
  parameters: {
    docs: { description: { story: "未选中状态，点击切换。" } },
  },
}

export const Checked: Story = {
  name: "选中",
  args: { defaultChecked: true },
  parameters: {
    docs: { description: { story: "默认选中状态。" } },
  },
}

export const WithLabel: Story = {
  name: "带标签",
  render: () => (
    <div className="flex items-center gap-2">
      <Checkbox id="story-checkbox-remember" />
      <Label htmlFor="story-checkbox-remember" className="font-normal">
        记住账号
      </Label>
    </div>
  ),
  parameters: {
    docs: { description: { story: "复选框与标签组合，点击标签可切换。" } },
  },
}

export const Disabled: Story = {
  name: "禁用",
  args: { disabled: true },
  parameters: {
    docs: { description: { story: "禁用态，不响应点击。" } },
  },
}
