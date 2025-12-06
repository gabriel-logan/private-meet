import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { EnvGlobalConfig } from "src/configs/types";

import { ChatGateway } from "./chat.gateway";
import { ChatService } from "./chat.service";

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService<EnvGlobalConfig, true>) => {
        const { jwt } = configService.get<EnvGlobalConfig["server"]>("server");

        return {
          secret: jwt.secret,
          signOptions: { expiresIn: jwt.expiration },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [ChatGateway, ChatService],
})
export class ChatModule {}
