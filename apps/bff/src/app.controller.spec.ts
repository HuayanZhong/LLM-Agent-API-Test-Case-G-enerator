import { Test } from "@nestjs/testing"
import { describe, expect, it } from "vitest"
import { AppModule } from "./app.module.js"
import { AppController } from "./app.controller.js"

describe("AppController", () => {
  it("health 返回服务名", async () => {
    // 走完整模块编译，顺带验证 Oxc 生成的 design:paramtypes 能被 Nest 读取。
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    const controller = moduleRef.get(AppController)
    expect(controller.health()).toEqual({ status: "ok", service: "bff" })
  })
})
