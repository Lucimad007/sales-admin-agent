import "reflect-metadata";
import { config } from "dotenv";
import path from "node:path";

config({ path: path.resolve(__dirname, "../../../.env") });
config();

import { NestFactory } from "@nestjs/core";
import cookieParser from "cookie-parser";
import { AppExceptionFilter } from "./common/exception.filter";
import { AppModule } from "./app.module";
import { loadEnv } from "./env";

async function bootstrap() {
  const env = loadEnv();
  const app = await NestFactory.create(AppModule, { cors: false });
  app.setGlobalPrefix("api");
  app.use(cookieParser());
  app.useGlobalFilters(new AppExceptionFilter());
  app.enableCors({
    origin: env.WEB_ORIGIN,
    credentials: true,
  });
  await app.listen(env.API_PORT);
  console.log(`api listening on :${env.API_PORT}`);
}

void bootstrap();
