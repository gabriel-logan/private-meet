import { IsString, IsUUID, Length } from "class-validator";
import {
  MAX_USERNAME_LENGTH,
  MIN_USERNAME_LENGTH,
} from "src/shared/constants/validation-constraints";

export class GetUserDto {
  @IsUUID()
  public userId: string;

  @Length(MIN_USERNAME_LENGTH, MAX_USERNAME_LENGTH)
  @IsString()
  public username: string;
}

export interface RoomsUserValue extends GetUserDto {
  joinedAt: number;
}
