import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@workspace/ui/components/alert"

describe("Alert", () => {
  it("渲染标题、描述与操作区", () => {
    render(
      <Alert>
        <AlertTitle>校验通过</AlertTitle>
        <AlertDescription>认证服务尚未接入。</AlertDescription>
        <AlertAction>关闭</AlertAction>
      </Alert>,
    )

    expect(screen.getByRole("alert")).toBeInTheDocument()
    expect(screen.getByText("校验通过")).toHaveAttribute("data-slot", "alert-title")
    expect(screen.getByText("认证服务尚未接入。")).toHaveAttribute("data-slot", "alert-description")
    expect(screen.getByText("关闭")).toHaveAttribute("data-slot", "alert-action")
  })

  it("支持 destructive 变体", () => {
    render(
      <Alert variant="destructive">
        <AlertTitle>登录失败</AlertTitle>
      </Alert>,
    )

    expect(screen.getByRole("alert")).toHaveClass("text-destructive")
  })
})
