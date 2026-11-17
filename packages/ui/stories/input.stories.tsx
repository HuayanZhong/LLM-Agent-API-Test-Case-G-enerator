import type { Meta, StoryObj } from "@storybook/react-vite"

import { Input } from "../src/components/input"

const meta = {
  title: "UI/Input",
  component: Input,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "基础输入框，透传原生 input 属性，支持禁用与 aria-invalid 错误态。",
      },
    },
  },
  args: {
    "aria-label": "账号",
    placeholder: "请输入账号",
  },
} satisfies Meta<typeof Input>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  name: "默认",
  parameters: {
    docs: { description: { story: "空白输入框，适用于账号、密码等单行字段。" } },
  },
}

export const WithValue: Story = {
  name: "带值",
  args: { defaultValue: "tester" },
  parameters: {
    docs: { description: { story: "已填入内容的状态。" } },
  },
}

export const Invalid: Story = {
  name: "错误态",
  args: { "aria-invalid": true, defaultValue: "abc" },
  parameters: {
    docs: { description: { story: "aria-invalid 触发错误边框与错误焦点环。" } },
  },
}

export const Disabled: Story = {
  name: "禁用",
  args: { disabled: true, defaultValue: "tester" },
  parameters: {
    docs: { description: { story: "禁用态，不接收输入与焦点。" } },
  },
}
