import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

export default function Page() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/30 p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>前端骨架已就绪</CardTitle>
          <CardDescription>Next.js 3000 / BFF 4000 / backend 5000</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            UI 组件来自 @workspace/ui；shadcn 组件会安装到 packages/ui。
          </p>
          <Button>开始</Button>
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground">
          按 <kbd className="rounded border px-1">d</kbd> 切换暗色
        </CardFooter>
      </Card>
    </main>
  )
}
