import { Expose } from 'class-transformer';
import { IsJWT, IsNotEmpty } from 'class-validator';

export class RefreshTokensDto {
  @Expose()
  @IsNotEmpty()
  @IsJWT()
  accessToken: string;

  @Expose()
  @IsNotEmpty()
  @IsJWT()
  refreshToken: string;
}
