import { Logger } from "@nestjs/common";
import {
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";

import { CreateMessageDto } from "./dto/create-message.dto";

@WebSocketGateway()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatGateway.name);

  @WebSocketServer()
  private readonly server: Server;

  private extractRoomIdFromCookies(cookie: string | undefined): string | null {
    if (!cookie) {
      return null;
    }

    const match = RegExp(/roomId=([^;]+)/).exec(cookie);

    return match ? match[1] : null;
  }

  async handleConnection(client: Socket): Promise<void> {
    this.logger.log(`Client connected: ${client.id}`);

    const cookies = client.handshake.headers.cookie;

    const roomId = this.extractRoomIdFromCookies(cookies);

    if (roomId) {
      await client.join(roomId);
    }
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage("message")
  handleMessage(@MessageBody() payload: CreateMessageDto): void {
    this.server.to(payload.roomId).emit("new-message", payload);
  }
}
