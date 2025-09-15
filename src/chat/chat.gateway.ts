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

@WebSocketGateway()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatGateway.name);

  @WebSocketServer()
  private readonly server: Server;

  handleConnection(client: Socket): void {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage("join-room")
  async handleJoinRoom(
    @MessageBody() payload: CreateRoomDto,
    @ConnectedSocket() client: Socket,
  ): Promise<Socket["id"]> {
    const { roomId } = payload;

    await client.join(roomId);

    this.logger.log(`Client ${client.id} joined room ${roomId}`);

    return client.id;
  }

  @SubscribeMessage("leave-room")
  async handleLeaveRoom(
    @MessageBody() payload: CreateRoomDto,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const { roomId } = payload;

    await client.leave(roomId);

    this.logger.log(`Client ${client.id} left room ${roomId}`);
  }

  @SubscribeMessage("message")
  handleMessage(@MessageBody() payload: CreateMessageDto): void {
    const timestamp = Date.now();

    payload.timestamp = timestamp;

    this.server.to(payload.roomId).emit("new-message", payload);
  }
}
