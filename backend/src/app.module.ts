import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";

import { AppController } from "./app.controller";
import { ChatModule } from "./chat/chat.module";
import envGlobal from "./configs/env.global";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envGlobal],
    }),
    ScheduleModule.forRoot(),
    ChatModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
