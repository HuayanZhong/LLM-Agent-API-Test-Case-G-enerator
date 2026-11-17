import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "../src/components/input-otp"

const meta = {
  title: "UI/InputOTP",
  component: InputOTP,
  tags: ["autodocs"],
  args: {
    maxLength: 6,
    children: null,
  },
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "验证码输入，按槽位展示字符；支持分组、分隔符、禁用与错误态。",
      },
    },
  },
} satisfies Meta<typeof InputOTP>

export default meta

type Story = StoryObj<typeof meta>

function Demo({ disabled = false }: { disabled?: boolean }) {
  const [value, setValue] = React.useState("")

  return (
    <InputOTP maxLength={6} value={value} onChange={setValue} disabled={disabled}>
      <InputOTPGroup>
        <InputOTPSlot index={0} />
        <InputOTPSlot index={1} />
      </InputOTPGroup>
      <InputOTPSeparator />
      <InputOTPGroup>
        <InputOTPSlot index={2} />
        <InputOTPSlot index={3} />
      </InputOTPGroup>
      <InputOTPSeparator />
      <InputOTPGroup>
        <InputOTPSlot index={4} />
        <InputOTPSlot index={5} />
      </InputOTPGroup>
    </InputOTP>
  )
}

export const Default: Story = {
  name: "默认",
  args: { maxLength: 6, children: null },
  render: () => <Demo />,
  parameters: {
    docs: { description: { story: "6 位验证码，2 + 2 + 2 分组展示。" } },
  },
}

export const Disabled: Story = {
  name: "禁用",
  args: { maxLength: 6, children: null },
  render: () => <Demo disabled />,
  parameters: {
    docs: { description: { story: "禁用态，不接收输入。" } },
  },
}
