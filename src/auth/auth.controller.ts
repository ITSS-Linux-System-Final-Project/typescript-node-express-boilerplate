import {
  Body,
  JsonController,
  Post,
  BadRequestError,
  BodyParam,
} from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { LoginDto } from './dtos/login.dto';
import { RefreshTokensDto } from './dtos/refreshTokens.dto';
import { AuthService } from './auth.service';

@JsonController('/auth')
export class AuthController {
  private readonly authService = new AuthService();

  @Post('/login')
  @OpenAPI({})
  async login(@Body() loginDto: LoginDto) {
    try {
      return this.authService.login(loginDto);
    } catch (e) {
      throw new BadRequestError('Email or password is incorrect.');
    }
  }

  @Post('/refresh')
  @OpenAPI({})
  async refreshTokens(@Body() refreshTokensDto: RefreshTokensDto) {
    try {
      const { accessToken, refreshToken } = refreshTokensDto;
      return this.authService.refreshTokens(accessToken, refreshToken);
    } catch (e) {
      throw new BadRequestError(e.message);
    }
  }

  @Post('/logout')
  @OpenAPI({ security: [{ BearerAuth: [] }] })
  async logout(@BodyParam('refreshToken') refreshToken: string) {
    try {
      await this.authService.logout(refreshToken);
      return {
        message: 'Success',
      };
    } catch (e) {
      throw new BadRequestError(e.message);
    }
  }
}
