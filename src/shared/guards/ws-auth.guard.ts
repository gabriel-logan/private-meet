import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { WsException } from "@nestjs/websockets";
import { Socket } from "socket.io";
import { EnvGlobalConfig } from "src/configs/types";

import { INVALID_TOKEN, NO_TOKEN_PROVIDED } from "../constants/error-messages";
import { ERROR } from "../constants/socket-events";
import { IS_PUBLIC_KEY } from "../decorators/routes/public.decorator";
import { JwtPayload } from "../types";

@Injectable()
export class WSAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<EnvGlobalConfig, true>,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const client = context.switchToWs().getClient<Socket>();

    const token = client.handshake.auth.token as string | undefined;

    if (!token) {
      client.emit(ERROR, NO_TOKEN_PROVIDED);
      throw new WsException(new UnauthorizedException(NO_TOKEN_PROVIDED));
    }

    const { jwt } = this.configService.get<EnvGlobalConfig["server"]>("server");

    try {
      const payload: JwtPayload = await this.jwtService.verifyAsync(token, {
        secret: jwt.secret,
      });

      client["user"] = payload;
    } catch {
      client.emit(ERROR, INVALID_TOKEN);
      throw new WsException(new UnauthorizedException(INVALID_TOKEN));
    }

    return true;
  }
}
