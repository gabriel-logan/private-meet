import { IsNumber, IsString, Max, MaxLength } from "class-validator";
import {
  MAX_ROOM_ID_LENGTH,
  MAX_TIMESTAMP,
} from "src/common/constants/validation-constraints";

export interface InnerMessage {
  readonly text: string;
  readonly roomId: string;
  readonly userId: string;
  readonly username: string;
}

export class CreateMessageDto {
  @MaxLength(MAX_ROOM_ID_LENGTH)
  @IsString()
  public roomId: string;

  @IsString()
  public cipher: string;

  @IsString()
  public iv: string;

  @IsString()
  public alg: string;

  @Max(MAX_TIMESTAMP)
  @IsNumber()
  public timestamp: number;
}
