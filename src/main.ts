import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import cookieParser from "cookie-parser";
import { readFileSync } from "fs";
import helmet from "helmet";
import { join } from "path";

import { AppModule } from "./app.module";
import type { EnvGlobalConfig } from "./configs/types";

const logger = new Logger("Bootstrap");

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    httpsOptions: {
      key: readFileSync(join(__dirname, "..", "secrets", "dev-key.pem")),
      cert: readFileSync(join(__dirname, "..", "secrets", "dev-cert.pem")),
    },
  });

  const configService =
    app.get<ConfigService<EnvGlobalConfig, true>>(ConfigService);

  const { nodeEnv, port } =
    configService.get<EnvGlobalConfig["server"]>("server");

  if (nodeEnv === "production") {
    app.use(helmet());

    app.set("trust proxy", true);
  }

  app.use(cookieParser());

  app.useStaticAssets(join(__dirname, "..", "public"));
  app.setBaseViewsDir(join(__dirname, "..", "views"));
  app.setViewEngine("hbs");

  await app.listen(port);

  logger.log(`Application running in ${nodeEnv} mode on port ${port}`);
  logger.log(`Application URL: https://localhost:${port}`);
}

void bootstrap();
