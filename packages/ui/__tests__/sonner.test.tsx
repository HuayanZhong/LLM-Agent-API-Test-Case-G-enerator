import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { Toaster } from "@workspace/ui/components/sonner"

const themeState = vi.hoisted(() => ({
  theme: "dark" as string | undefined,
}))

vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: themeState.theme }),
}))

// 真实 Sonner 会创建 portal；测试只验证包装层把主题透传下去。
vi.mock("sonner", () => ({
  Toaster: (props: { theme?: string }) => <div data-testid="sonner" data-theme={props.theme} />,
}))

beforeEach(() => {
  themeState.theme = "dark"
})

describe("Toaster", () => {
  it("把 next-themes 的主题透传给 Sonner", () => {
    render(<Toaster />)

    expect(screen.getByTestId("sonner")).toHaveAttribute("data-theme", "dark")
  })

  it("主题未就绪时回落到 system", () => {
    themeState.theme = undefined
    render(<Toaster />)

    expect(screen.getByTestId("sonner")).toHaveAttribute("data-theme", "system")
  })
})
