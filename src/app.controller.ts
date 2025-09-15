import { Controller, Get, Query, Render, Res } from "@nestjs/common";
import type { Response } from "express";

import { AppService } from "./app.service";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

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
  ): { roomId: string } | void {
    if (!roomId) {
      return response.redirect("/");
    }

    return { roomId };
  }
}
