import { compareSync } from 'bcrypt';
import { sign, verify } from 'jsonwebtoken';
import ms from 'ms';
import { BadRequestError } from 'routing-controllers';
import { redisClient } from '../config/redis-client';
import { LoginDto } from './dtos/login.dto';
import { UserDocument, UserModel } from '../user/user.model';

export class AuthRepository {
  private comparePassword(password: string, hashedPassword: string): boolean {
    return compareSync(password, hashedPassword);
  }

  private generateToken(
    email: string,
    role: string,
    secret: string,
    expiresIn: string,
  ): string {
    return sign(
      {
        email,
        role,
      },
      secret,
      { expiresIn },
    );
  }

  private async logTokenToRedis(
    email: string,
    refreshToken: string,
    accessToken: string,
  ) {
    const redisKey = `auth:${email}:${refreshToken}`;
    await redisClient.set(redisKey, accessToken);
    redisClient.expire(redisKey, ms(process.env.JWT_REFRESH_EXPIRES_IN) / 1000);
  }

  private async removeTokenFromRedis(email: string, refreshToken: string) {
    redisClient.del(`auth:${email}:${refreshToken}`);
  }

  async getUserPassword(email: string): Promise<UserDocument | null> {
    return UserModel.findOne({ email })
      .select({
        _id: 0,
        email: 1,
        hashed_password: 1,
        type: 1,
        status: 1,
      })
      .lean();
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    let role: string;
    try {
      const user = await this.getUserPassword(email);
      if (!user || user.status === 2 || user.del_flag)
        throw new Error(`Email ${email} does not exist.`);
      if (!this.comparePassword(password, user.hashed_password))
        throw new Error('Incorrect password');
      role = user.type;

      const {
        JWT_SECRET,
        JWT_EXPIRES_IN,
        JWT_REFRESH_SECRET,
        JWT_REFRESH_EXPIRES_IN,
      } = process.env;

      const accessToken = this.generateToken(
        email,
        role,
        JWT_SECRET,
        JWT_EXPIRES_IN,
      );
      const refreshToken = this.generateToken(
        email,
        role,
        JWT_REFRESH_SECRET,
        JWT_REFRESH_EXPIRES_IN,
      );

      this.logTokenToRedis(email, refreshToken, accessToken);
      return {
        accessToken,
        refreshToken,
      };
    } catch (e) {
      throw new BadRequestError('Email or password is incorrect.');
    }
  }
  /* eslint-disable @typescript-eslint/no-explicit-any */

  async refreshTokens(accessToken: string, refreshToken: string) {
    const {
      JWT_SECRET,
      JWT_EXPIRES_IN,
      JWT_REFRESH_SECRET,
      JWT_REFRESH_EXPIRES_IN,
    } = process.env;

    try {
      const refreshPayload: any = verify(refreshToken, JWT_REFRESH_SECRET);
      const tokenPayload: any = verify(accessToken, JWT_SECRET, {
        ignoreExpiration: true,
      });

      const { email, role } = tokenPayload;
      const hasRefreshToken = await redisClient.exists(
        `auth:${email}:${refreshToken}`,
      );
      if (!hasRefreshToken) {
        throw new Error('Invalid refresh token.');
      }
      this.removeTokenFromRedis(email, refreshToken);
      if (refreshPayload.email !== email) {
        throw new Error('Tokens mismatch.');
      }

      const newAccessToken = this.generateToken(
        email,
        role,
        JWT_SECRET,
        JWT_EXPIRES_IN,
      );
      const newRefreshToken = this.generateToken(
        email,
        role,
        JWT_REFRESH_SECRET,
        JWT_REFRESH_EXPIRES_IN,
      );

      this.logTokenToRedis(email, newRefreshToken, newAccessToken);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (e) {
      throw new BadRequestError(e.message);
    }
  }
  /* eslint-enable */

  async logout(refreshToken: string) {
    try {
      const payload = verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      const { email } = payload as Record<string, string>;
      redisClient.del(`auth:${email}:${refreshToken}`);
    } catch (e) {
      throw new BadRequestError(e.message);
    }
  }
}
