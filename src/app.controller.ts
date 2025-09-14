import { Controller, Get, Query, Render, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";

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
    @Req() request: Request,
    @Res() response: Response,
    @Query("roomId") roomId?: string,
  ): { roomId: string } | void {
    const roomIds = request.cookies["room-ids"] as
      | { [key: string]: string }[]
      | undefined;

    // Verify if roomId Query exists and is valid
    if (roomId && roomIds?.some((room) => room.roomId === roomId)) {
      return { roomId };
    }

    return response.redirect("/");
  }
}
