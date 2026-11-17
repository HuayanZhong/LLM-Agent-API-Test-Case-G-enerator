import { cn } from "@workspace/ui/lib/utils"

import packageJson from "../../../../package.json"

import { STEP_INDEX_WIDTH } from "../_lib/auth-constants"
import { ProductMark } from "./product-mark"

// 四步对应产品的真实闭环：生成 → 执行 → 比对 → 报告；顺序是规格的一部分。
const steps = [
  { title: "生成用例", status: "待输入" },
  { title: "执行测试", status: "Agent" },
  { title: "比对现场", status: "GraphRAG" },
  { title: "输出报告", status: "人工确认" },
] as const

// 编号由数组索引生成，避免在文案里重复写 01–04。
function formatStepIndex(index: number) {
  return String(index + 1).padStart(STEP_INDEX_WIDTH, "0")
}

/**
 * 登录页左栏：产品定位与四步复验轨道。
 * md 起以窄栏出现，lg 起展示完整品牌内容。
 */
function LoginBrandPanel({ className }: { className?: string }) {
  return (
    // md 起显示左栏；宽度由 (auth)/layout.tsx 的网格列控制，2xl 放大后仍保持可滚动。
    <aside
      className={cn(
        "hidden h-full min-h-0 flex-col overflow-y-auto border-r border-border bg-sidebar px-8 py-8 md:flex",
        className,
      )}
    >
      {/* 内容列单独限宽、水平居中并整体垂直居中；引语紧随轨道，不钉在视口底部。 */}
      <div className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center gap-8 xl:max-w-lg">
        {/* 产品标识与名称：移动端由 (auth)/layout.tsx 重复一份，这里只负责 md 以上。 */}
        <div className="flex items-center gap-3">
          <ProductMark className="size-8 xl:size-10" />
          <div>
            <p className="text-sm font-semibold tracking-tight xl:text-base">
              接口测试用例辅助生成系统
            </p>
            <p className="mt-0.5 font-mono text-xs tracking-widest text-muted-foreground">
              接口测试 · 智能体辅助
            </p>
          </div>
        </div>

        <div>
          {/* md 只保留标识与轨道，lg 起才展开完整定位文案，避免窄栏拥挤。 */}
          <div className="hidden lg:block">
            <p className="font-mono text-xs tracking-widest text-muted-foreground">VERIFY LOOP</p>
            <h2 className="mt-4 text-2xl leading-tight font-semibold tracking-tight text-balance xl:text-3xl 2xl:text-4xl">
              把接口测试做成可复验的闭环
            </h2>
            <p className="mt-4 text-sm leading-6 text-muted-foreground xl:text-base xl:leading-7">
              从接口生成用例，由 Agent 执行，与正常现场比对；不一致时重放复现，最后交付测试报告。
            </p>
          </div>

          {/* 左侧竖线串起四步，是页面的签名元素；状态用等宽字强化“工具感”。 */}
          <ol className="mt-0 border-l border-border lg:mt-8 xl:mt-12">
            {steps.map((step, index) => (
              <li key={step.title} className="relative pb-5 pl-6 last:pb-0 xl:pb-7">
                <span
                  aria-hidden="true"
                  className="absolute top-1.5 -left-1 size-2 rounded-full bg-foreground/30 ring-4 ring-sidebar"
                />
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-xs tabular-nums text-muted-foreground">
                    {formatStepIndex(index)}
                  </span>
                  <span className="text-sm font-medium">{step.title}</span>
                </div>
                <p className="mt-1 pl-8 font-mono text-xs tracking-wider text-muted-foreground">
                  {step.status}
                </p>
              </li>
            ))}
          </ol>

          {/* 把系统红线放在登录页，提醒使用者系统只诊断与复验；紧随轨道，不钉在视口底部。 */}
          <div className="mt-8">
            <p className="border-l-2 border-foreground/20 pl-4 text-sm leading-6 xl:text-base">
              系统只诊断与复验，不改代码。
            </p>
            {/* 版本信息在 md 窄栏里会换行，lg 起再显示。 */}
            <p className="mt-6 hidden font-mono text-xs tracking-widest text-muted-foreground lg:block">
              本地工作台 · 静态演示 · v{packageJson.version}
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}

export { LoginBrandPanel }
