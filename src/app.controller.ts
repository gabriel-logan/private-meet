import { Controller, Get, Query, Render, Res } from "@nestjs/common";
import type { Response } from "express";

import { AppService } from "./app.service";
import { EMOJIS } from "./common/constants/emojis";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get("healthz")
  getHealth(): { status: string } {
    return { status: "ok" };
  }

  @Get()
  @Render("index")
  getHello(): { message: string } {
    return this.appService.getHello();
  }

  @Get("chat")
  @Render("chat")
  getChat(
    @Res() response: Response,
    @Query("roomId") roomId?: string,
  ): { roomId: string; emojis: typeof EMOJIS } | void {
    if (!roomId) {
      return response.redirect("/");
    }

    return { roomId, emojis: EMOJIS };
  }
}
