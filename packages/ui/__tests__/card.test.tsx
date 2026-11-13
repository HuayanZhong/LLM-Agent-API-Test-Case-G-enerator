import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

describe("Card", () => {
  it("组合渲染全部区块", () => {
    render(
      <Card size="sm">
        <CardHeader>
          <CardTitle>标题</CardTitle>
          <CardDescription>描述</CardDescription>
          <CardAction>操作</CardAction>
        </CardHeader>
        <CardContent>内容</CardContent>
        <CardFooter>页脚</CardFooter>
      </Card>,
    )

    expect(screen.getByText("标题")).toBeInTheDocument()
    expect(screen.getByText("描述")).toBeInTheDocument()
    expect(screen.getByText("操作")).toBeInTheDocument()
    expect(screen.getByText("内容")).toBeInTheDocument()
    expect(screen.getByText("页脚")).toBeInTheDocument()
    expect(screen.getByText("标题").closest("[data-slot=card]")).toHaveAttribute(
      "data-size",
      "sm",
    )
  })
})
