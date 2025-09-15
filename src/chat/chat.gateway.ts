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

import { CreateMessageDto } from "./dto/create-message.dto";
import { CreateRoomDto } from "./dto/create-room.dto";
import { GetUsersOnlineDto } from "./dto/get-users-online.dto";

@WebSocketGateway()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatGateway.name);

  private readonly users = new Map<Socket["id"], string>();

  @WebSocketServer()
  private readonly server: Server;

  private getOnlineUsers(roomId: string): GetUsersOnlineDto[] {
    const room = this.server.sockets.adapter.rooms.get(roomId);

    if (!room) {
      return [];
    }

    return Array.from(room).map((clientId) => ({
      clientId,
      username: this.users.get(clientId) ?? "Unknown",
    }));
  }

  handleConnection(client: Socket): void {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);

    this.users.delete(client.id);

    // Notify all rooms the client was part of about the updated online users
    for (const room of client.rooms) {
      if (room !== client.id) {
        this.server.to(room).emit("online-users", this.getOnlineUsers(room));
      }
    }
  }

  @SubscribeMessage("request-online-users")
  handleGetOnlineUsers(
    @MessageBody() payload: { roomId: string },
    @ConnectedSocket() client: Socket,
  ): void {
    const { roomId } = payload;

    client.emit("online-users", this.getOnlineUsers(roomId));
  }

  @SubscribeMessage("join-room")
  async handleJoinRoom(
    @MessageBody() payload: CreateRoomDto,
    @ConnectedSocket() client: Socket,
  ): Promise<Socket["id"]> {
    const { roomId, username } = payload;

    this.users.set(client.id, username);

    await client.join(roomId);

    this.logger.log(`Client ${client.id} joined room ${roomId}`);

    this.server.to(roomId).emit("online-users", this.getOnlineUsers(roomId));

    return client.id;
  }

  @SubscribeMessage("leave-room")
  async handleLeaveRoom(
    @MessageBody() payload: CreateRoomDto,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const { roomId } = payload;

    this.users.delete(client.id);

    await client.leave(roomId);

    this.server.to(roomId).emit("online-users", this.getOnlineUsers(roomId));

    this.logger.log(`Client ${client.id} left room ${roomId}`);
  }

  @SubscribeMessage("message")
  handleMessage(@MessageBody() payload: CreateMessageDto): void {
    const timestamp = Date.now();

    payload.timestamp = timestamp;

    this.server.to(payload.roomId).emit("new-message", payload);
  }
}
