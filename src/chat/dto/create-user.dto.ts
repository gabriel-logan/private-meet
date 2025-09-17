import { IsString, Length } from "class-validator";
import {
  MAX_USERNAME_LENGTH,
  MIN_USERNAME_LENGTH,
} from "src/common/constants/validation-constraints";

export class CreateUserDto {
  @Length(MIN_USERNAME_LENGTH, MAX_USERNAME_LENGTH)
  @IsString()
  public username: string;
}
