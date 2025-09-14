import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import envGlobal from "./configs/env.global";

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [envGlobal],
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
