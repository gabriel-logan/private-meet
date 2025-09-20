import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Cron, CronExpression } from "@nestjs/schedule";
import { randomUUID } from "crypto";
import { EnvGlobalConfig } from "src/configs/types";
import { AuthPayload, JwtPayload } from "src/shared/types";

import { CreateUserDto } from "./dto/create-user.dto";
import { GetUserDto, RoomsUserMapValue } from "./dto/get-user.dto";

@Injectable()
export class ChatService {
  /**
   * @description roomId -> (userId -> RoomsUserMapValue)
   * @description new Map<roomId, Map<userId, RoomsUserMapValue>>();
   */
  private readonly rooms = new Map<string, Map<string, RoomsUserMapValue>>();

  /**
   * @description roomId -> (userId -> Set<socketId>)
   * @description new Map<roomId, Map<userId, Set<socketId>>>();
   */
  private readonly roomUserSockets = new Map<
    string,
    Map<string, Set<string>>
  >();

  constructor(
    private readonly configService: ConfigService<EnvGlobalConfig, true>,
    private readonly jwtService: JwtService,
  ) {}

  @Cron(CronExpression.EVERY_WEEK)
  protected cleanupOldUsersFromRooms(): void {
    const now = Date.now();
    const threshold = 6 * 24 * 60 * 60 * 1000; // 6 days in milliseconds

    this.rooms.forEach((roomUsers, roomId) => {
      roomUsers.forEach((user, userId) => {
        if (now - user.joinedAt > threshold) {
          roomUsers.delete(userId);
        }
      });

      // If room is empty after cleanup, remove it
      if (roomUsers.size === 0) {
        this.rooms.delete(roomId);
        this.roomUserSockets.delete(roomId);
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
    if (!this.roomUserSockets.has(roomId)) {
      this.roomUserSockets.set(roomId, new Map());
    }

    // Get the maps for the room and user sockets
    const roomUsers = this.rooms.get(roomId)!;
    const roomSockets = this.roomUserSockets.get(roomId)!;

    // Add the user to the room if not already present
    if (!roomUsers.has(user.userId)) {
      roomUsers.set(user.userId, { ...user, joinedAt: Date.now() });
    }

    // Add the socket ID to the user's set of sockets
    if (!roomSockets.has(user.userId)) {
      roomSockets.set(user.userId, new Set());
    }

    roomSockets.get(user.userId)!.add(socketId);
  }

  removeUserFromRoom(roomId: string, userId: string, socketId: string): void {
    const roomSockets = this.roomUserSockets.get(roomId);
    const roomUsers = this.rooms.get(roomId);

    if (!roomSockets?.has(userId)) {
      return;
    }

    const sockets = roomSockets.get(userId)!;

    sockets.delete(socketId);

    if (sockets.size === 0) {
      // Last socket for this user, remove user from room
      roomSockets.delete(userId);
      roomUsers?.delete(userId);

      // If room is empty, remove room
      if (roomUsers?.size === 0) {
        this.rooms.delete(roomId);
      }
      if (roomSockets.size === 0) {
        this.roomUserSockets.delete(roomId);
      }
    }
  }

  removeUserFromAllRooms(userId: string, socketId: string): string[] {
    const affectedRooms: string[] = [];

    this.roomUserSockets.forEach((roomSockets, roomId) => {
      if (roomSockets.has(userId)) {
        this.removeUserFromRoom(roomId, userId, socketId);
        affectedRooms.push(roomId);
      }
    });

    return affectedRooms;
  }

  getOnlineUsersInRoom(roomId: string): RoomsUserMapValue[] {
    return Array.from(this.rooms.get(roomId)?.values() || []);
  }
}
