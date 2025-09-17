import {
  IsNumber,
  IsString,
  IsUUID,
  Length,
  Max,
  MaxLength,
} from "class-validator";
import {
  MAX_MESSAGE_LENGTH,
  MAX_ROOM_ID_LENGTH,
  MAX_TIMESTAMP,
  MAX_USERNAME_LENGTH,
  MIN_MESSAGE_LENGTH,
  MIN_USERNAME_LENGTH,
} from "src/common/constants/validation-constraints";

export class CreateMessageDto {
  @Length(MIN_MESSAGE_LENGTH, MAX_MESSAGE_LENGTH)
  @IsString()
  public text: string;

  @MaxLength(MAX_ROOM_ID_LENGTH)
  @IsString()
  public roomId: string;

  @IsUUID()
  public userId: string;

  @Length(MIN_USERNAME_LENGTH, MAX_USERNAME_LENGTH)
  @IsString()
  public username: string;

  @Max(MAX_TIMESTAMP)
  @IsNumber()
  public timestamp: number;
}
