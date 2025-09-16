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
import {
  GENERATE_ROOM_ID,
  JOIN_ROOM,
  LEAVE_ROOM,
  MESSAGE,
  NEW_MESSAGE,
  ONLINE_USERS,
  REQUEST_ONLINE_USERS,
  STOP_TYPING,
  TYPING,
} from "src/common/constants/socketEvents";
import { v4 as uuidv4 } from "uuid";

import { CreateMessageDto } from "./dto/create-message.dto";
import { CreateRoomDto } from "./dto/create-room.dto";
import { GetUsersOnlineDto } from "./dto/get-users-online.dto";

@WebSocketGateway()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatGateway.name);

  private readonly users = new Map<Socket["id"], string>();

  @WebSocketServer()
  private readonly server: Server;

  private generateRandomId(): string {
    return uuidv4();
  }

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
        this.server.to(room).emit(ONLINE_USERS, this.getOnlineUsers(room));
      }
    }
  }

  @SubscribeMessage(GENERATE_ROOM_ID)
  handleGenerateRoomId(): string {
    return this.generateRandomId();
  }

  @SubscribeMessage(REQUEST_ONLINE_USERS)
  handleGetOnlineUsers(
    @MessageBody() payload: { roomId: string },
    @ConnectedSocket() client: Socket,
  ): void {
    const { roomId } = payload;

    client.emit(ONLINE_USERS, this.getOnlineUsers(roomId));
  }

  @SubscribeMessage(JOIN_ROOM)
  async handleJoinRoom(
    @MessageBody() payload: CreateRoomDto,
    @ConnectedSocket() client: Socket,
  ): Promise<Socket["id"]> {
    const { roomId, username } = payload;

    this.users.set(client.id, username);

    await client.join(roomId);

    this.logger.log(`Client ${client.id} joined room ${roomId}`);

    this.server.to(roomId).emit(ONLINE_USERS, this.getOnlineUsers(roomId));

    return client.id;
  }

  @SubscribeMessage(LEAVE_ROOM)
  async handleLeaveRoom(
    @MessageBody() payload: CreateRoomDto,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const { roomId } = payload;

    this.users.delete(client.id);

    await client.leave(roomId);

    this.server.to(roomId).emit(ONLINE_USERS, this.getOnlineUsers(roomId));

    this.logger.log(`Client ${client.id} left room ${roomId}`);
  }

  @SubscribeMessage(MESSAGE)
  handleMessage(@MessageBody() payload: CreateMessageDto): void {
    const timestamp = Date.now();

    payload.timestamp = timestamp;

    this.server.to(payload.roomId).emit(NEW_MESSAGE, payload);
  }

  @SubscribeMessage(TYPING)
  handleTyping(
    @MessageBody() payload: CreateRoomDto,
    @ConnectedSocket() client: Socket,
  ): void {
    const { roomId, username } = payload;

    this.server.to(roomId).emit(TYPING, {
      clientId: client.id,
      username,
    });
  }

  @SubscribeMessage(STOP_TYPING)
  handleStopTyping(
    @MessageBody() payload: CreateRoomDto,
    @ConnectedSocket() client: Socket,
  ): void {
    const { roomId, username } = payload;

    this.server.to(roomId).emit(STOP_TYPING, {
      clientId: client.id,
      username,
    });
  }
}
