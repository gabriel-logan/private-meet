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
  MESSAGE_ENCRYPTED,
} from "src/shared/constants/validation-constraints";

export interface InnerMessage {
  readonly text: string;
  readonly userId: string;
  readonly username: string;
}

export class CreateMessageDto {
  @MaxLength(MAX_ROOM_ID_LENGTH)
  @IsString()
  public roomId: string;

  @MaxLength(MESSAGE_ENCRYPTED.CIPHER_MAX_LENGTH)
  @IsString()
  public cipher: string;

  @Length(MESSAGE_ENCRYPTED.IV_LENGTH, MESSAGE_ENCRYPTED.IV_LENGTH)
  @IsString()
  public iv: string;

  @IsIn([MESSAGE_ENCRYPTED.ALGORITHM])
  @Length(
    MESSAGE_ENCRYPTED.ALGORITHM_LENGTH,
    MESSAGE_ENCRYPTED.ALGORITHM_LENGTH,
  )
  @IsString()
  public alg: string;

  @Max(MAX_TIMESTAMP)
  @IsNumber()
  public timestamp: number;
}
