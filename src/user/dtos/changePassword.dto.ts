import { Expose } from 'class-transformer';
import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class ChangePasswordDto {
  @Expose()
  @IsNotEmpty()
  @IsString()
  @MinLength(4)
  @MaxLength(30)
  old_password: string;

  @Expose()
  @IsNotEmpty()
  @IsString()
  @MinLength(4)
  @MaxLength(30)
  new_password: string;
}
