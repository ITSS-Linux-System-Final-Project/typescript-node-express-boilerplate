import { Expose } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterUserDto {
  @Expose()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @Expose()
  @IsNotEmpty()
  @IsString()
  @MinLength(4)
  @MaxLength(30)
  password: string;

  @Expose()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  @MinLength(10)
  phone: string;

  @Expose()
  @IsNotEmpty()
  @IsString()
  @MaxLength(40)
  @MinLength(1)
  fullname: string;
}
