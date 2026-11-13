import type { Meta, StoryObj } from "@storybook/react-vite"

import { Button } from "../src/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../src/components/card"

const meta = {
  title: "UI/Card",
  component: Card,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "卡片容器，按 CardHeader / CardTitle / CardDescription / CardContent / CardFooter 组合使用。",
      },
    },
  },
} satisfies Meta<typeof Card>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  name: "默认",
  render: () => (
    <Card className="w-90">
      <CardHeader>
        <CardTitle>前端骨架已就绪</CardTitle>
        <CardDescription>Next.js 3000 / BFF 4000 / backend 5000</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          UI 组件来自 @workspace/ui；shadcn 组件会安装到 packages/ui。
        </p>
      </CardContent>
      <CardFooter>
        <Button size="sm">开始</Button>
      </CardFooter>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: "完整卡片组合：标题、描述、内容与底部操作。",
      },
    },
  },
}
