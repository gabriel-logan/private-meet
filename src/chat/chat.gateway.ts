import { Logger, UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
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
} from "src/shared/constants/socket-events";
import { Public } from "src/shared/decorators/routes/public.decorator";
import { WSAuthGuard } from "src/shared/guards/ws-auth.guard";

import { ChatService } from "./chat.service";
import { CreateMessageDto } from "./dto/create-message.dto";
import { CreateUserDto } from "./dto/create-user.dto";
import { GetUserDto, RoomsUserMapValue } from "./dto/get-user.dto";
import { RoomDto } from "./dto/room.dto";

@UsePipes(ValidationPipe)
@UseGuards(WSAuthGuard)
@WebSocketGateway()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatGateway.name);

  private readonly rooms = new Map<string, Map<string, RoomsUserMapValue>>();

  constructor(private readonly chatService: ChatService) {}

  @WebSocketServer()
  private readonly server: Server;

  private addUserToRoom(roomId: string, user: GetUserDto): void {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Map());
    }

    this.rooms.get(roomId)!.set(user.userId, { ...user, joinedAt: Date.now() });
  }

  private removeUserFromRoom(roomId: string, userId: string): void {
    this.rooms.get(roomId)?.delete(userId);

    if (this.rooms.get(roomId)?.size === 0) {
      this.rooms.delete(roomId);
    }
  }

  private getOnlineUsersInRoom(roomId: string): RoomsUserMapValue[] {
    return Array.from(this.rooms.get(roomId)?.values() || []);
  }

  handleConnection(client: Socket): void {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @Public()
  @SubscribeMessage(SIGN_IN)
  async handleSignIn(
    @MessageBody() createUserDto: CreateUserDto,
  ): Promise<string> {
    return await this.chatService.signInJwt(createUserDto);
  }

  @Public()
  @SubscribeMessage(GENERATE_ROOM_ID)
  handleGenerateRoomId(): string {
    return this.chatService.generateRandomId();
  }

  @SubscribeMessage(REQUEST_ONLINE_USERS)
  handleGetOnlineUsers(
    @MessageBody() payload: RoomDto,
    @ConnectedSocket() client: Socket,
  ): void {
    const { roomId } = payload;

    client.emit(ONLINE_USERS, this.getOnlineUsersInRoom(roomId));
  }

  @SubscribeMessage(JOIN_ROOM)
  async handleJoinRoom(
    @MessageBody() payload: RoomDto,
    @ConnectedSocket() client: Socket,
  ): Promise<GetUserDto> {
    const { roomId } = payload;
    const { sub, username } = client.user!;

    const user: GetUserDto = { userId: sub, username };

    await client.join(roomId);

    this.addUserToRoom(roomId, user);

    this.logger.log(`Client ${client.id} joined room ${roomId}`);

    client.to(roomId).emit(ONLINE_USERS, this.getOnlineUsersInRoom(roomId));

    return user;
  }

  @SubscribeMessage(LEAVE_ROOM)
  async handleLeaveRoom(
    @MessageBody() payload: RoomDto,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const { roomId } = payload;
    const { sub } = client.user!;

    await client.leave(roomId);

    this.removeUserFromRoom(roomId, sub);

    this.logger.log(`Client ${client.id} left room ${roomId}`);

    client.to(roomId).emit(ONLINE_USERS, this.getOnlineUsersInRoom(roomId));
  }

  @SubscribeMessage(MESSAGE)
  handleMessage(
    @MessageBody() payload: CreateMessageDto,
    @ConnectedSocket() client: Socket,
  ): void {
    const timestamp = Date.now();

    payload.timestamp = timestamp;

    client.broadcast.to(payload.roomId).emit(NEW_MESSAGE, payload);
  }

  @SubscribeMessage(TYPING)
  handleTyping(
    @MessageBody() payload: RoomDto,
    @ConnectedSocket() client: Socket,
  ): void {
    const { roomId } = payload;
    const { username } = client.user!;

    client.broadcast.to(roomId).emit(TYPING, {
      username,
    });
  }

  @SubscribeMessage(STOP_TYPING)
  handleStopTyping(
    @MessageBody() payload: RoomDto,
    @ConnectedSocket() client: Socket,
  ): void {
    const { roomId } = payload;
    const { username } = client.user!;

    client.broadcast.to(roomId).emit(STOP_TYPING, {
      username,
    });
  }
}
