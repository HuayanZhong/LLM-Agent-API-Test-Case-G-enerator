import type { Meta, StoryObj } from "@storybook/react-vite"
import { toast } from "sonner"

import { Button } from "../src/components/button"
import { Toaster } from "../src/components/sonner"

const meta = {
  title: "UI/Sonner",
  component: Toaster,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "Toast 容器，主题跟随 next-themes；业务侧用 sonner 的 toast 触发提示。",
      },
    },
  },
} satisfies Meta<typeof Toaster>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  name: "默认",
  render: () => (
    <>
      <Toaster />
      <Button onClick={() => toast.success("操作成功")}>显示 Toast</Button>
    </>
  ),
  parameters: {
    docs: { description: { story: "成功提示，使用 shadcn 默认图标区分类型。" } },
  },
}

export const ErrorToast: Story = {
  name: "错误",
  render: () => (
    <>
      <Toaster />
      <Button variant="destructive" onClick={() => toast.error("请检查输入")}>
        显示错误
      </Button>
    </>
  ),
  parameters: {
    docs: { description: { story: "错误提示，使用 shadcn 默认图标区分类型。" } },
  },
}
