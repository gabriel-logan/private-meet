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

  private extractRoomIdsFromCookies(cookie: string | undefined): string[] {
    if (!cookie) {
      return [];
    }

    // Divide the cookies by ";"
    const cookiesArr = cookie.split(";").map((c) => c.trim());

    const roomIds: string[] = [];

    for (const c of cookiesArr) {
      const value = c.split("=")[1];

      if (!value) {
        continue;
      }

      try {
        // Decode the values
        const decoded = decodeURIComponent(value);
        // Remove the "j:" prefix if it exists
        const jsonStr = decoded.startsWith("j:") ? decoded.slice(2) : decoded;

        const obj = JSON.parse(jsonStr) as { roomId: string };

        if (obj.roomId) {
          roomIds.push(obj.roomId);
        }
      } catch {
        // Ignore cookies that aren't valid
        continue;
      }
    }
    return roomIds;
  }

  async handleConnection(client: Socket): Promise<void> {
    this.logger.log(`Client connected: ${client.id}`);

    const cookies = client.handshake.headers.cookie;

    const roomIds = this.extractRoomIdsFromCookies(cookies);

    this.logger.log(`Client ${client.id} joined rooms: ${roomIds.join(", ")}`);

    const joinPromises = roomIds.map((roomId) => client.join(roomId));

    await Promise.all(joinPromises);
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage("message")
  handleMessage(@MessageBody() payload: CreateMessageDto): void {
    this.server.to(payload.roomId).emit("new-message", payload);
  }
}
