import { Controller, Post, Res } from "@nestjs/common";
import type { Response } from "express";
import { v4 as uuidv4 } from "uuid";

import { CreateRoomDto } from "./dto/create-room.dto";

@Controller("chat")
export class ChatController {
  @Post("generate-room")
  generateRoom(@Res({ passthrough: true }) response: Response): CreateRoomDto {
    const maxAge = 1000 * 60 * 60 * 24 * 1; // 1 day

    const roomId = uuidv4(); // Gera o novo roomId

    response.cookie(
      "room-ids",
      [
        {
          roomId: roomId,
        },
      ],
      {
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
        maxAge: maxAge,
      },
    );

    return {
      roomId: roomId,
    };
  }
}
