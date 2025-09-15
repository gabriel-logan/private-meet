import { Logger } from "@nestjs/common";
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { v4 as uuidv4 } from "uuid";

import { CreateMessageDto } from "./dto/create-message.dto";
import { CreateRoomDto } from "./dto/create-room.dto";

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

  private generateCookieHeader(
    key: string,
    value: string,
    options: {
      httpOnly: boolean;
      sameSite: "strict" | "lax" | "none";
      secure: boolean;
      maxAge: number;
    },
  ): string {
    let cookie = `${key}=${value}; Path=/;`;

    if (options.httpOnly) {
      cookie += " HttpOnly;";
    }

    cookie += ` SameSite=${options.sameSite};`;
    cookie += ` Secure=${options.secure};`;
    cookie += ` Max-Age=${options.maxAge};`;

    return cookie;
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

  @SubscribeMessage("verify-room")
  handleVerifyRoom(@MessageBody() payload: CreateRoomDto): boolean {
    const { roomId } = payload;

    const room = this.server.sockets.adapter.rooms.get(roomId);

    if (room) {
      return true;
    }

    return false;
  }

  @SubscribeMessage("generate-room")
  handleGenerateRoom(@ConnectedSocket() client: Socket): string {
    const maxAge = 1000 * 60 * 60 * 24 * 1; // 1 day

    const roomId = uuidv4();

    const cookieHeader = this.generateCookieHeader("roomId", roomId, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: maxAge,
    });

    client.handshake.headers["set-cookie"] = [cookieHeader];

    return roomId;
  }

  @SubscribeMessage("message")
  handleMessage(@MessageBody() payload: CreateMessageDto): void {
    this.server.to(payload.roomId).emit("new-message", payload);
  }
}
