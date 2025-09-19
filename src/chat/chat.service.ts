import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { randomUUID } from "crypto";
import { EnvGlobalConfig } from "src/configs/types";
import { AuthPayload, JwtPayload } from "src/shared/types";

import { CreateUserDto } from "./dto/create-user.dto";
import { GetUserDto, RoomsUserMapValue } from "./dto/get-user.dto";

@Injectable()
export class ChatService {
  private readonly rooms = new Map<string, Map<string, RoomsUserMapValue>>();

  constructor(
    private readonly configService: ConfigService<EnvGlobalConfig, true>,
    private readonly jwtService: JwtService,
  ) {}

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

  addUserToRoom(roomId: string, user: GetUserDto): void {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Map());
    }

    this.rooms.get(roomId)!.set(user.userId, { ...user, joinedAt: Date.now() });
  }

  removeUserFromRoom(roomId: string, userId: string): void {
    this.rooms.get(roomId)?.delete(userId);

    if (this.rooms.get(roomId)?.size === 0) {
      this.rooms.delete(roomId);
    }
  }

  getOnlineUsersInRoom(roomId: string): RoomsUserMapValue[] {
    return Array.from(this.rooms.get(roomId)?.values() || []);
  }
}
