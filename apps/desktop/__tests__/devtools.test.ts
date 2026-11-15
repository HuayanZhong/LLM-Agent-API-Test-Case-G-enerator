import { describe, expect, it, vi } from "vitest"
import { configureDevToolsShortcuts } from "../src/app/devtools"

type Input = { type: string; key: string; control: boolean; shift: boolean }

function fakeWebContents() {
  let handler: ((event: { preventDefault(): void }, input: Input) => void) | undefined
  return {
    on(
      event: "before-input-event",
      listener: (event: { preventDefault(): void }, input: Input) => void,
    ) {
      if (event === "before-input-event") handler = listener
    },
    toggleDevTools: vi.fn<() => void>(),
    press(input: Partial<Input> & { key: string }) {
      const event = { preventDefault: vi.fn<() => void>() }
      handler?.(event, { type: "keyDown", control: false, shift: false, ...input })
      return event
    },
  }
}

describe("configureDevToolsShortcuts", () => {
  it("F12 按下时切换并阻止默认行为", () => {
    const wc = fakeWebContents()
    configureDevToolsShortcuts(wc)
    const event = wc.press({ key: "F12" })
    expect(wc.toggleDevTools).toHaveBeenCalledTimes(1)
    expect(event.preventDefault).toHaveBeenCalled()
  })

  it("Ctrl+Shift+I 切换 DevTools", () => {
    const wc = fakeWebContents()
    configureDevToolsShortcuts(wc)
    wc.press({ key: "i", control: true, shift: true })
    expect(wc.toggleDevTools).toHaveBeenCalledTimes(1)
  })

  it("缺少 Ctrl 或 Shift 时不拦截", () => {
    const wc = fakeWebContents()
    configureDevToolsShortcuts(wc)
    expect(wc.press({ key: "i", control: true }).preventDefault).not.toHaveBeenCalled()
    expect(wc.press({ key: "i", shift: true }).preventDefault).not.toHaveBeenCalled()
    expect(wc.toggleDevTools).not.toHaveBeenCalled()
  })

  it("keyUp 不触发切换", () => {
    const wc = fakeWebContents()
    configureDevToolsShortcuts(wc)
    wc.press({ key: "F12", type: "keyUp" })
    expect(wc.toggleDevTools).not.toHaveBeenCalled()
  })
})
