import { Controller, Get, Post, Query, Render, Res } from "@nestjs/common";
import type { Response } from "express";
import { v4 as uuidv4 } from "uuid";

import { AppService } from "./app.service";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get("healthz")
  getHealth(): { status: string } {
    return { status: "ok" };
  }

  @Post("generate-room-id")
  generateRoomId(): { roomId: string } {
    return { roomId: uuidv4() };
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
  ): { roomId: string } | void {
    if (!roomId) {
      return response.redirect("/");
    }

    return { roomId };
  }
}
