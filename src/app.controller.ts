import { Controller, Get, Query, Render, Res } from "@nestjs/common";
import type { Response } from "express";

import { EMOJIS } from "./common/constants/emojis";

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
    @Query("roomId") roomId?: string,
  ): { roomId: string; emojis: typeof EMOJIS } | void {
    if (!roomId) {
      return response.redirect("/");
    }

    return { roomId, emojis: EMOJIS };
  }
}
