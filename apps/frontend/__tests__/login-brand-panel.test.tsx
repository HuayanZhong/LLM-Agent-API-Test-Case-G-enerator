import { renderWithIntl } from "./test-utils"
import { screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { LoginBrandPanel } from "@/app/(auth)/_components/brand/login-brand-panel"

// 左栏是纯展示组件：断言四步轨道与红线文案；断点布局由浏览器实测覆盖。
describe("LoginBrandPanel", () => {
  it("展示产品定位、四步复验轨道与红线引语", () => {
    renderWithIntl(<LoginBrandPanel />)

    expect(screen.getByText("接口测试用例辅助生成系统")).toBeInTheDocument()
    expect(screen.getAllByText("把接口测试做成可复验的闭环").length).toBeGreaterThan(0)

    for (const step of ["生成用例", "执行测试", "比对现场", "输出报告"]) {
      expect(screen.getByText(step)).toBeInTheDocument()
    }

    expect(screen.getByText("系统只诊断与复验，不改代码。")).toBeInTheDocument()
    expect(screen.getByText(/本地工作台/)).toBeInTheDocument()
  })

  it("英文界面下品牌文案与四步轨道使用英文", () => {
    renderWithIntl(<LoginBrandPanel />, { locale: "en-US" })

    expect(screen.getByText("API Test Case Assistant")).toBeInTheDocument()
    for (const step of ["Generate cases", "Run tests", "Compare baseline", "Deliver report"]) {
      expect(screen.getByText(step)).toBeInTheDocument()
    }
    expect(
      screen.getByText("The system diagnoses and verifies only; it never changes code."),
    ).toBeInTheDocument()
  })
})
