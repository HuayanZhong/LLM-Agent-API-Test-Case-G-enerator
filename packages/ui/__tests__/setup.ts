import "@testing-library/jest-dom/vitest"
import { cleanup } from "@testing-library/react"
import { afterEach } from "vitest"

// globals 关闭后 RTL 不会再自动 cleanup，这里显式注册。
afterEach(() => cleanup())
