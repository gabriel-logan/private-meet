import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { EnvGlobalConfig } from "src/configs/types";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class ChatService {
  constructor(
    private readonly configService: ConfigService<EnvGlobalConfig, true>,
    private readonly jwtService: JwtService,
  ) {}

  async signInJwt(username: string): Promise<string> {
    const userId = this.generateRandomId();

    const payload = { userId, username };

    return await this.jwtService.signAsync(payload);
  }

  async verifyJwt(
    token: string,
  ): Promise<{ userId: string; username: string }> {
    const { jwt } = this.configService.get<EnvGlobalConfig["server"]>("server");

    const payload: { userId: string; username: string } =
      await this.jwtService.verifyAsync(token, {
        secret: jwt.secret,
      });

    return payload;
  }

  generateRandomId(): string {
    return uuidv4();
  }
}
