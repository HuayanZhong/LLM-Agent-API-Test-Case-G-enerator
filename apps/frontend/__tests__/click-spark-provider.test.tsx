import { act, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { ClickSparkProvider } from "@/components/layout/click-spark-provider"

const sparkColorMock = vi.hoisted(() => vi.fn<() => string | undefined>(() => undefined))

// 捕获传给 ClickSpark 的 props,验证默认参数集与覆盖行为
const sparkProps = vi.hoisted(() => {
  const props: Array<Record<string, unknown>> = []
  return props
})

vi.mock("@/lib/spark-color", () => ({
  resolveSparkColor: sparkColorMock,
}))

vi.mock("@workspace/ui/components/click-spark", () => ({
  default: (props: Record<string, unknown>) => {
    sparkProps.push(props)
    return <div data-testid="spark-root">{props.children as React.ReactNode}</div>
  },
}))

beforeEach(() => {
  sparkColorMock.mockClear()
  sparkColorMock.mockReturnValue(undefined)
  sparkProps.length = 0
})

afterEach(() => {
  // 清掉测试期间模拟主题切换留下的 class
  document.documentElement.className = "font-sans antialiased"
})

const latestProps = () => sparkProps[sparkProps.length - 1]!

describe("ClickSparkProvider", () => {
  it("未传 props 时以默认参数集生效,layer 固定 front", () => {
    render(
      <ClickSparkProvider>
        <span>页面内容</span>
      </ClickSparkProvider>,
    )

    expect(screen.getByText("页面内容")).toBeInTheDocument()
    expect(latestProps()).toMatchObject({
      layer: "front",
      sparkCount: 9,
      sparkSize: 8,
      sparkRadius: 14,
      sparkWidth: 1.5,
      duration: 350,
      easing: "spring",
      shape: "star",
      randomness: 0.05,
      glow: 1,
      ring: true,
    })
  })

  it("调用方显式传参覆盖对应默认项,其余保持默认", () => {
    render(
      <ClickSparkProvider sparkCount={3} duration={120}>
        <span>页面内容</span>
      </ClickSparkProvider>,
    )

    expect(latestProps()).toMatchObject({
      sparkCount: 3,
      duration: 120,
      sparkSize: 8,
      shape: "star",
    })
  })

  it("首帧解析主题色,html class 变更后重新解析", async () => {
    render(
      <ClickSparkProvider>
        <span>页面内容</span>
      </ClickSparkProvider>,
    )

    // 首帧:useState 惰性初始化解析一次
    expect(sparkColorMock).toHaveBeenCalledTimes(1)

    // 模拟 next-themes 切主题:先改 DOM class,observer 回调在微任务里重解析,async act 等它冲刷
    sparkColorMock.mockReturnValue("rgb(10, 20, 30)")
    await act(async () => {
      document.documentElement.classList.add("dark")
    })

    expect(sparkColorMock).toHaveBeenCalledTimes(2)
    expect(latestProps().sparkColor).toBe("rgb(10, 20, 30)")
  })
})
