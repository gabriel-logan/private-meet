import { IsNumber, IsString, Length, Max, MaxLength } from "class-validator";
import {
  MAX_MESSAGE_LENGTH,
  MAX_ROOM_ID_LENGTH,
  MAX_TIMESTAMP,
  MIN_MESSAGE_LENGTH,
} from "src/common/constants/validation-constraints";

import type { GetUserDto } from "./get-user.dto";

export class CreateMessageDto {
  @Length(MIN_MESSAGE_LENGTH, MAX_MESSAGE_LENGTH)
  @IsString()
  public text: string;

  @MaxLength(MAX_ROOM_ID_LENGTH)
  @IsString()
  public roomId: string;

  public sender: GetUserDto;

  @Max(MAX_TIMESTAMP)
  @IsNumber()
  public timestamp: number;
}
