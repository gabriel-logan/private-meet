import {
  Logger,
  UseFilters,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from "@nestjs/websockets";
import { ValidationError } from "class-validator";
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
  WEBRTC_ANSWER,
  WEBRTC_ICE_CANDIDATE,
  WEBRTC_OFFER,
} from "src/shared/constants/socket-events";
import { Public } from "src/shared/decorators/routes/public.decorator";
import { WsExceptionFilter } from "src/shared/filters/ws-exception.filter";
import { WSAuthGuard } from "src/shared/guards/ws-auth.guard";

import { ChatService } from "./chat.service";
import { CreateMessageDto } from "./dto/create-message.dto";
import { CreateUserDto } from "./dto/create-user.dto";
import { GetUserDto } from "./dto/get-user.dto";
import { RoomDto } from "./dto/room.dto";

@UseFilters(WsExceptionFilter)
@UsePipes(
  new ValidationPipe({
    exceptionFactory: (errors: ValidationError[]): void => {
      const messages = errors
        .map((error) => Object.values(error.constraints || {}))
        .flat();

      throw new WsException(messages);
    },
  }),
)
@UseGuards(WSAuthGuard)
@WebSocketGateway()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatGateway.name);

  constructor(private readonly chatService: ChatService) {}

  @WebSocketServer()
  private readonly server: Server;

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

    client.emit(ONLINE_USERS, this.chatService.getOnlineUsersInRoom(roomId));
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

    this.chatService.addUserToRoom(roomId, user, client.id);

    this.logger.log(`Client ${client.id} joined room ${roomId}`);

    client
      .to(roomId)
      .emit(ONLINE_USERS, this.chatService.getOnlineUsersInRoom(roomId));

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

    this.chatService.removeUserFromRoom(roomId, sub, client.id);

    this.logger.log(`Client ${client.id} left room ${roomId}`);

    client
      .to(roomId)
      .emit(ONLINE_USERS, this.chatService.getOnlineUsersInRoom(roomId));
  }

  @SubscribeMessage(MESSAGE)
  handleMessage(
    @MessageBody() payload: CreateMessageDto,
    @ConnectedSocket() client: Socket,
  ): { ok: boolean } {
    const timestamp = Date.now();

    payload.timestamp = timestamp;

    client.broadcast.to(payload.roomId).emit(NEW_MESSAGE, payload);

    return { ok: true };
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

  private findSocketsByUserId(roomId: string, userId: string): Socket[] {
    const room = this.server.sockets.adapter.rooms.get(roomId);

    if (!room) {
      return [];
    }

    const result: Socket[] = [];

    room.forEach((socketId) => {
      const s = this.server.sockets.sockets.get(socketId);

      if (s && s.user?.sub === userId) {
        result.push(s);
      }
    });

    return result;
  }

  @SubscribeMessage(WEBRTC_OFFER)
  handleWebrtcOffer(
    @MessageBody()
    payload: {
      roomId: string;
      offer: RTCSessionDescriptionInit;
      to?: string; // Destination userId
    },
    @ConnectedSocket() client: Socket,
  ): void {
    const { roomId, offer, to } = payload;
    const fromUserId = client.user!.sub;

    if (to) {
      const targets = this.findSocketsByUserId(roomId, to);

      if (targets.length === 0) {
        return;
      }

      targets.forEach((sock) => {
        sock.emit(WEBRTC_OFFER, { offer, from: fromUserId, to });
      });
    } else {
      // Fallback broadcast
      client.broadcast
        .to(roomId)
        .emit(WEBRTC_OFFER, { offer, from: fromUserId });
    }
  }

  @SubscribeMessage(WEBRTC_ANSWER)
  handleWebrtcAnswer(
    @MessageBody()
    payload: {
      roomId: string;
      answer: RTCSessionDescriptionInit;
      to: string; // Destination userId
    },
    @ConnectedSocket() client: Socket,
  ): void {
    const { roomId, answer, to } = payload;
    const fromUserId = client.user!.sub;

    const targets = this.findSocketsByUserId(roomId, to);

    targets.forEach((sock) => {
      sock.emit(WEBRTC_ANSWER, { answer, from: fromUserId, to });
    });
  }

  @SubscribeMessage(WEBRTC_ICE_CANDIDATE)
  handleWebrtcIceCandidate(
    @MessageBody()
    payload: {
      roomId: string;
      candidate: RTCIceCandidateInit;
      to: string; // Destination userId
    },
    @ConnectedSocket() client: Socket,
  ): void {
    const { roomId, candidate, to } = payload;
    const fromUserId = client.user!.sub;

    const targets = this.findSocketsByUserId(roomId, to);

    targets.forEach((sock) => {
      sock.emit(WEBRTC_ICE_CANDIDATE, {
        candidate,
        from: fromUserId,
        to,
      });
    });
  }
}
