import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { AuthPayload, JwtPayload } from "src/common/types";
import { EnvGlobalConfig } from "src/configs/types";
import { v4 as uuidv4 } from "uuid";

import { CreateUserDto } from "./dto/create-user.dto";

@Injectable()
export class ChatService {
  constructor(
    private readonly configService: ConfigService<EnvGlobalConfig, true>,
    private readonly jwtService: JwtService,
  ) {}

  async signInJwt(createUserDto: CreateUserDto): Promise<string> {
    const userId = this.generateRandomId();

    const { username } = createUserDto;

    const payload: AuthPayload = { sub: userId, username };

    return await this.jwtService.signAsync(payload);
  }

  async verifyJwt(token: string): Promise<JwtPayload> {
    const { jwt } = this.configService.get<EnvGlobalConfig["server"]>("server");

    const payload: JwtPayload = await this.jwtService.verifyAsync(token, {
      secret: jwt.secret,
    });

    return payload;
  }

  generateRandomId(): string {
    return uuidv4();
  }
}
