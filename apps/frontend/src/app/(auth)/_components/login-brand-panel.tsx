import { cn } from "@workspace/ui/lib/utils"

import packageJson from "../../../../package.json"

import { STEP_INDEX_WIDTH } from "../_lib/auth-constants"
import { ProductMark } from "./product-mark"
import { ScannerBackdrop } from "./scanner-backdrop"

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
        "relative hidden h-full min-h-0 flex-col overflow-y-auto border-r border-border bg-sidebar px-8 py-8 md:flex",
        className,
      )}
    >
      {/* 扫描线只做背景底纹：绝对铺满、先做一层失焦，内容层始终压在它上面。 */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 blur-xs">
        <ScannerBackdrop />
      </div>
      {/* 内容列单独限宽、水平居中并整体垂直居中；引语紧随轨道，不钉在视口底部。 */}
      <div className="relative mx-auto flex min-h-full w-full max-w-md flex-col justify-center gap-10 xl:max-w-lg">
        {/* 产品标识与名称：移动端由 (auth)/layout.tsx 重复一份，这里只负责 md 以上。 */}
        <div className="flex items-center gap-3">
          <ProductMark className="size-9 xl:size-10" />
          <div className="min-w-0">
            <p className="text-sm leading-tight font-semibold tracking-tight xl:text-base">
              接口测试用例辅助生成系统
            </p>
            <p className="mt-1 text-xs leading-none tracking-widest text-muted-foreground">
              接口测试 · 智能体辅助
            </p>
          </div>
        </div>

        <div>
          {/* md 只保留标识与轨道，lg 起才展开完整定位文案，避免窄栏拥挤。 */}
          <div className="hidden lg:block">
            {/* 眉标一行给出观察范围（01–04）与右侧延伸线，像报告页的栏头。 */}
            <div className="flex items-center gap-3">
              <p className="font-label text-xs font-semibold tracking-widest text-muted-foreground">
                VERIFY LOOP
              </p>
              <span aria-hidden="true" className="h-px flex-1 bg-border" />
              <p className="font-label text-xs tabular-nums tracking-widest text-muted-foreground">
                01—04
              </p>
            </div>
            {/* 题头固定断成两行：第二行落在“可复验的闭环”上，让主张单独成句；用 p 而不是 h2，页面主标题留给登录表单。 */}
            <p className="font-title mt-6 text-3xl leading-snug text-foreground xl:text-4xl">
              把接口测试做成
              <br />
              可复验的闭环
            </p>
            <p className="mt-4 text-sm leading-6 text-muted-foreground xl:text-base xl:leading-7">
              从接口生成用例，由 Agent 执行，与正常现场比对；不一致时重放复现，最后交付测试报告。
            </p>
          </div>

          {/* 左侧竖线串起四步，是页面的签名元素；状态右对齐成台账，索引与状态分列两端。 */}
          <ol className="mt-0 border-l border-foreground/20 lg:mt-10 xl:mt-12">
            {steps.map((step, index) => (
              <li key={step.title} className="relative py-3 pl-6 first:pt-1 last:pb-1">
                <span
                  aria-hidden="true"
                  className="absolute top-1/2 -left-1 size-2 -translate-y-1/2 rounded-full bg-foreground/35 ring-4 ring-sidebar"
                />
                <div className="flex items-baseline gap-3">
                  <span className="font-label text-xs font-semibold tabular-nums text-muted-foreground">
                    {formatStepIndex(index)}
                  </span>
                  <span className="text-sm font-medium">{step.title}</span>
                  {/* 点线引导把标题与右端状态连成一行，状态不再悬挂在标题下方。 */}
                  <span
                    aria-hidden="true"
                    className="h-0 flex-1 self-center border-b border-dotted border-border"
                  />
                  <span className="font-mono text-xs tracking-wider text-muted-foreground">
                    {step.status}
                  </span>
                </div>
              </li>
            ))}
          </ol>

          {/* 闭环的回落边：只说明不一致时从哪里回退，不新增第五步。 */}
          <p className="mt-3 pl-6 font-mono text-xs tracking-wider text-muted-foreground">
            ↺ 不一致时重放复现
          </p>

          {/* 把系统红线放在登录页，提醒使用者系统只诊断与复验；紧随轨道，不钉在视口底部。 */}
          <div className="mt-10">
            <p className="font-title border-l-2 border-foreground/25 pl-4 text-base leading-7 xl:text-lg">
              系统只诊断与复验，不改代码。
            </p>
            {/* 版本信息在 md 窄栏里会换行，lg 起再显示。 */}
            <div className="mt-8 hidden items-center justify-between gap-4 border-t border-border pt-4 lg:flex">
              <p className="font-mono text-xs tracking-widest text-muted-foreground">
                本地工作台 · 静态演示
              </p>
              <p className="font-mono text-xs tabular-nums tracking-widest text-muted-foreground">
                v{packageJson.version}
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}

export { LoginBrandPanel }
