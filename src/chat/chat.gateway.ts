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
import { Room } from "./entities/room.entity";

@WebSocketGateway()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatGateway.name);

  private readonly rooms = new Map<string, Room[]>();

  @WebSocketServer()
  private readonly server: Server;

  handleConnection(client: Socket): void {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage("message")
  handleMessage(@MessageBody() payload: CreateMessageDto): void {
    this.server.emit("new-message", payload);
  }
}
