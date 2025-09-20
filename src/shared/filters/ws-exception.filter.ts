import { ArgumentsHost, Catch } from "@nestjs/common";
import { BaseWsExceptionFilter, WsException } from "@nestjs/websockets";
import { Socket } from "socket.io";

import { INTERNAL_SERVER_ERROR } from "../constants/error-messages";
import { ERROR } from "../constants/socket-events";

@Catch()
export class WsExceptionFilter extends BaseWsExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): boolean {
    const ctx = host.switchToWs();
    const client = ctx.getClient<Socket>();

    if (exception instanceof WsException) {
      const errorMessage = exception.getError();

      return client.emit(ERROR, errorMessage);
    }

    return client.emit(ERROR, INTERNAL_SERVER_ERROR);
  }
}
