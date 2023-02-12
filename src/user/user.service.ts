import { UserRepository } from './user.repository';
import { ChangePasswordDto } from './dtos/changePassword.dto';
import { ChangeProfileDto } from './dtos/changeProfile.dto';
import { UserDocument } from './user.model';
import { ResetPasswordDto } from './dtos/resetPassword.dto';
import { RegisterUserDto } from './dtos/registerUser.dto';

export class UserService {
  private readonly userRepository = new UserRepository();
  
  async getUserByEmail(email: string): Promise<UserDocument> {
    return this.userRepository.getUserByEmail(email);
  }

  async registerUser(registerUserDto: RegisterUserDto) {
    return this.userRepository.register(registerUserDto);
  }

  async changePassword(user_id: string, changePasswordDto: ChangePasswordDto) {
    return this.userRepository.changePassword(user_id, changePasswordDto);
  }

  async changeProfile(
    user_id: string,
    changeProfileDto: ChangeProfileDto,
  ) {
    return this.userRepository.changeProfile(
      user_id,
      changeProfileDto,
    );
  }

  
  async sendResetPasswordRequest(user_email: string) {
    return this.userRepository.sendResetPasswordRequest(user_email);
  }
  
  async verifyActive(activeToken: string) {
    return this.userRepository.verifyActive(activeToken);
  }

  async verifyActiveToken(active_token: string) {
    return this.userRepository.verifyActiveToken(active_token);
  }

  async resetPassword(
    active_token: string,
    resetPasswordDto: ResetPasswordDto,
  ) {
    return this.userRepository.resetPassword(active_token, resetPasswordDto);
  }

}
