import {
  BadRequestException,
  Controller,
  Get,
  Query,
  Render,
  Res,
} from "@nestjs/common";
import type { Response } from "express";

import { EMOJIS } from "./shared/constants/emojis";
import { MAX_ROOM_ID_LENGTH } from "./shared/constants/validation-constraints";

@Controller()
export class AppController {
  @Get("healthz")
  health(): { status: string } {
    return { status: "ok" };
  }

  @Get()
  @Render("index")
  home(): { title: string } {
    return { title: "Welcome to Private Meet!" };
  }

  @Get("chat")
  @Render("chat")
  chat(
    @Res() response: Response,
    @Query("roomId") roomId?: string | string[],
  ): { roomId: string; emojis: typeof EMOJIS } | void {
    if (!roomId) {
      return response.redirect("/");
    }

    if (typeof roomId !== "string") {
      throw new BadRequestException("Only one room ID is allowed.");
    }

    if (roomId.length > MAX_ROOM_ID_LENGTH) {
      throw new BadRequestException(
        `Room ID must not exceed ${MAX_ROOM_ID_LENGTH} characters.`,
      );
    }

    return { roomId, emojis: EMOJIS };
  }
}
