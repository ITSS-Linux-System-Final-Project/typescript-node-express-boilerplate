import { Expose } from 'class-transformer';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class EmailDto {
  @Expose()
  @IsNotEmpty()
  @IsEmail()
  email: string;
}
