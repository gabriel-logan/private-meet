import {
  IsIn,
  IsNumber,
  IsString,
  Length,
  Max,
  MaxLength,
} from "class-validator";
import {
  MAX_ROOM_ID_LENGTH,
  MAX_TIMESTAMP,
} from "src/shared/constants/validation-constraints";

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

  @MaxLength(5000)
  @IsString()
  public cipher: string;

  @Length(16, 16)
  @IsString()
  public iv: string;

  @IsIn(["AES-GCM"])
  @Length(7, 7)
  @IsString()
  public alg: string;

  @Max(MAX_TIMESTAMP)
  @IsNumber()
  public timestamp: number;
}
