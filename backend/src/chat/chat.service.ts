import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Cron, CronExpression } from "@nestjs/schedule";
import { randomUUID } from "crypto";
import { Server, Socket } from "socket.io";
import { EnvGlobalConfig } from "src/configs/types";
import { AuthPayload, JwtPayload } from "src/shared/types";

import { CreateUserDto } from "./dto/create-user.dto";
import { GetUserDto, RoomsUserValue } from "./dto/get-user.dto";

@Injectable()
export class ChatService {
  /**
   * @description roomId -> (userId -> { user: RoomsUserValue, sockets: Set<socketId> })
   * @description new Map<roomId, Map<userId, { user: RoomsUserValue, sockets: Set<socketId> }>>();
   * @description This structure allows tracking multiple socket connections per user in a room.
   */
  private readonly rooms = new Map<
    string,
    Map<string, { user: RoomsUserValue; sockets: Set<string> }>
  >();

  constructor(
    private readonly configService: ConfigService<EnvGlobalConfig, true>,
    private readonly jwtService: JwtService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  cleanupOldUsersFromRooms(): void {
    const now = Date.now();
    const threshold = 1000 * 60 * 60 * 23; // 23 hours

    this.rooms.forEach((roomUsers, roomId) => {
      roomUsers.forEach((entry, userId) => {
        if (now - entry.user.joinedAt > threshold) {
          roomUsers.delete(userId);
        }
      });

      if (roomUsers.size === 0) {
        this.rooms.delete(roomId);
      }
    });
  }

  async signInJwt(createUserDto: CreateUserDto): Promise<string> {
    const userId = this.generateRandomId();

    const { username } = createUserDto;

    const payload: AuthPayload = { sub: userId, username };

    return await this.jwtService.signAsync(payload);
  }

  async verifyJwt(token: string): Promise<JwtPayload> {
    const { jwt } = this.configService.get<EnvGlobalConfig["server"]>("server");

    const payload: JwtPayload = await this.jwtService.verifyAsync(token, {
      secret: jwt.secret,
    });

    return payload;
  }

  generateRandomId(): string {
    return randomUUID();
  }

  addUserToRoom(roomId: string, user: GetUserDto, socketId: string): void {
    // Create structures if they don't exist
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Map());
    }

    const roomUsers = this.rooms.get(roomId)!;

    if (!roomUsers.has(user.userId)) {
      roomUsers.set(user.userId, {
        user: { ...user, joinedAt: Date.now() },
        sockets: new Set([socketId]),
      });

      return void 0;
    }

    roomUsers.get(user.userId)!.sockets.add(socketId);
  }

  removeUserFromRoom(roomId: string, userId: string, socketId: string): void {
    const roomUsers = this.rooms.get(roomId);

    if (!roomUsers) {
      return void 0;
    }

    const entry = roomUsers.get(userId);

    if (!entry) {
      return void 0;
    }

    entry.sockets.delete(socketId);

    if (entry.sockets.size === 0) {
      roomUsers.delete(userId);

      if (roomUsers.size === 0) {
        this.rooms.delete(roomId);
      }
    }
  }

  removeUserFromAllRooms(userId: string, socketId: string): string[] {
    const affected: string[] = [];

    this.rooms.forEach((roomUsers, roomId) => {
      if (roomUsers.has(userId)) {
        this.removeUserFromRoom(roomId, userId, socketId);

        affected.push(roomId);
      }
    });

    return affected;
  }

  getOnlineUsersInRoom(roomId: string): RoomsUserValue[] {
    const roomUsers = this.rooms.get(roomId);

    if (!roomUsers) {
      return [];
    }

    return Array.from(roomUsers.values()).map((entry) => entry.user);
  }

  getUserSocketIdsInRoom(roomId: string, userId: string): string[] {
    const roomUsers = this.rooms.get(roomId);

    if (!roomUsers) {
      return [];
    }

    const entry = roomUsers.get(userId);

    if (!entry) {
      return [];
    }

    return Array.from(entry.sockets);
  }

  findSocketsByUserId(
    roomId: string,
    userId: string,
    server: Server,
  ): Socket[] {
    const socketIds = this.getUserSocketIdsInRoom(roomId, userId);

    const result: Socket[] = [];

    socketIds.forEach((socketId) => {
      const s = server.sockets.sockets.get(socketId);

      if (s && s.user?.sub === userId) {
        result.push(s);
      }
    });

    return result;
  }
}
