import { Expose } from 'class-transformer';
import { IsString, IsDateString, IsOptional } from 'class-validator';

export class ChangeProfileDto {
  @Expose()
  @IsOptional()
  @IsString()
  phone: string;

  @Expose()
  @IsOptional()
  @IsString()
  fullname: string;

  @Expose()
  @IsOptional()
  @IsDateString()
  birthday: Date;

  @Expose()
  @IsOptional()
  @IsString()
  address: string;

  @Expose()
  @IsOptional()
  @IsString()
  avatar: string;
}
