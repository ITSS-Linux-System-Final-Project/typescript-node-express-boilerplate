import { LoginDto } from './dtos/login.dto';
import { AuthRepository } from './auth.repository';

export class AuthService {
  private readonly authRepository = new AuthRepository();

  async login(loginDto: LoginDto) {
    return this.authRepository.login(loginDto);
  }

  async refreshTokens(accessToken: string, refreshToken: string) {
    return this.authRepository.refreshTokens(accessToken, refreshToken);
  }

  async logout(refreshToken: string) {
    return this.authRepository.logout(refreshToken);
  }
}
