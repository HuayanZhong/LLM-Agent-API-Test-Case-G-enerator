import { renderWithIntl } from "./test-utils"
import { fireEvent, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { ThemeToggle } from "@/components/theme-toggle"

const theme = vi.hoisted(() => ({
  resolvedTheme: "light" as string | undefined,
  setTheme: vi.fn<(theme: string) => void>(),
}))

vi.mock("next-themes", () => ({
  useTheme: () => theme,
}))

beforeEach(() => {
  theme.resolvedTheme = "light"
  theme.setTheme.mockClear()
})

describe("ThemeToggle", () => {
  it("亮色下切换到暗色", () => {
    renderWithIntl(<ThemeToggle />)

    fireEvent.click(screen.getByRole("button", { name: "切换主题" }))

    expect(theme.setTheme).toHaveBeenCalledWith("dark")
  })

  it("暗色下切换到亮色", () => {
    theme.resolvedTheme = "dark"
    renderWithIntl(<ThemeToggle />)

    fireEvent.click(screen.getByRole("button", { name: "切换主题" }))

    expect(theme.setTheme).toHaveBeenCalledWith("light")
  })
})
