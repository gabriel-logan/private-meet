import { Logger, UseGuards } from "@nestjs/common";
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
  SIGN_IN,
  STOP_TYPING,
  TYPING,
} from "src/common/constants/socketEvents";
import { WSAuthGuard } from "src/common/guards/ws-auth.guard";

import { ChatService } from "./chat.service";
import { CreateMessageDto } from "./dto/create-message.dto";
import { CreateUserDto } from "./dto/create-user.dto";
import { GetUserDto } from "./dto/get-user.dto";
import { RoomDto } from "./dto/room.dto";

@UseGuards(WSAuthGuard)
@WebSocketGateway()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatGateway.name);

  private readonly users = new Map<string, string>();

  constructor(private readonly chatService: ChatService) {}

  @WebSocketServer()
  private readonly server: Server;

  private getOnlineUsers(roomId: string): GetUserDto[] {
    const room = this.server.sockets.adapter.rooms.get(roomId);

    if (!room) {
      return [];
    }

    return Array.from(room).map((userId) => ({
      userId: userId,
      username: this.users.get(userId) ?? "Unknown",
    }));
  }

  handleConnection(client: Socket): void {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage(SIGN_IN)
  async handleSignIn(@MessageBody() payload: CreateUserDto): Promise<string> {
    const { username } = payload;

    return await this.chatService.signInJwt(username);
  }

  @SubscribeMessage(GENERATE_ROOM_ID)
  handleGenerateRoomId(): string {
    return this.chatService.generateRandomId();
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
    @MessageBody() payload: RoomDto,
    @ConnectedSocket() client: Socket,
  ): Promise<GetUserDto> {
    const { roomId } = payload;
    const { sub, username } = client.user!;

    this.users.set(sub, username);

    await client.join(roomId);

    this.logger.log(`Client ${client.id} joined room ${roomId}`);

    this.server.to(roomId).emit(ONLINE_USERS, this.getOnlineUsers(roomId));

    return { userId: sub, username };
  }

  @SubscribeMessage(LEAVE_ROOM)
  async handleLeaveRoom(
    @MessageBody() payload: RoomDto,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const { roomId } = payload;
    const { sub } = client.user!;

    this.users.delete(sub);

    await client.leave(roomId);

    this.server.to(roomId).emit(ONLINE_USERS, this.getOnlineUsers(roomId));

    this.logger.log(`Client ${client.id} left room ${roomId}`);
  }

  @SubscribeMessage(MESSAGE)
  handleMessage(@MessageBody() payload: CreateMessageDto): void {
    this.server.to(payload.roomId).emit(NEW_MESSAGE, payload);
  }

  @SubscribeMessage(TYPING)
  handleTyping(
    @MessageBody() payload: RoomDto,
    @ConnectedSocket() client: Socket,
  ): void {
    const { roomId } = payload;
    const { sub, username } = client.user!;

    this.server.to(roomId).emit(TYPING, {
      userId: sub,
      username,
    });
  }

  @SubscribeMessage(STOP_TYPING)
  handleStopTyping(
    @MessageBody() payload: RoomDto,
    @ConnectedSocket() client: Socket,
  ): void {
    const { roomId } = payload;
    const { sub, username } = client.user!;

    this.server.to(roomId).emit(STOP_TYPING, {
      userId: sub,
      username,
    });
  }
}
