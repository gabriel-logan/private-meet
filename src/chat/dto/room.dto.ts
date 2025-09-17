import { IsString, MaxLength } from "class-validator";
import { MAX_ROOM_ID_LENGTH } from "src/common/constants/validation-constraints";

export class RoomDto {
  @MaxLength(MAX_ROOM_ID_LENGTH)
  @IsString()
  public roomId: string;
}
