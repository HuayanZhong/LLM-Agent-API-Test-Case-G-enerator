import { NestFactory } from "@nestjs/core"
import { AppModule } from "./app.module.js"
import { loadConfig } from "./config.js"

async function bootstrap() {
  const config = loadConfig()
  const app = await NestFactory.create(AppModule)
  await app.listen(config.BACKEND_PORT)
}
await bootstrap()
