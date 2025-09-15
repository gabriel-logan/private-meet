import { Injectable } from "@nestjs/common";

@Injectable()
export class AppService {
  getHello(): { message: string } {
    return { message: "Welcome to the Private Meet!" };
  }
}
