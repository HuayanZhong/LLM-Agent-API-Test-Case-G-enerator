import { Controller, Get } from "@nestjs/common"
import type { HealthResponse } from "@workspace/types"

@Controller()
export class AppController {
  @Get("health")
  health(): HealthResponse {
    return { status: "ok", service: "backend" }
  }
}
