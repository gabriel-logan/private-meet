import type { GetUserDto } from "./get-user.dto";

export class CreateMessageDto {
  public text: string;
  public roomId: string;
  public sender: GetUserDto;
  public timestamp: number;
}
