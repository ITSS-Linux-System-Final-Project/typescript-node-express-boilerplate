import {
  Body,
  JsonController,
  Get,
  Post,
  BadRequestError,
  CurrentUser,
  Authorized,
  UploadedFile,
  Param,
  Put,
  Patch,
} from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { UserService } from './user.service';
import { UserDocument } from './user.model';
import { ChangePasswordDto } from './dtos/changePassword.dto';
import { ChangeProfileDto } from './dtos/changeProfile.dto';
import { fileUploadOptions } from '../config/multer';
import { EmailDto } from './dtos/email.dto';
import { ResetPasswordDto } from './dtos/resetPassword.dto';
import { RegisterUserDto } from './dtos/registerUser.dto';

@JsonController('/user')
export class UserController {
  private readonly userService = new UserService();

  @Get('', { transformResponse: false })
  @OpenAPI({
    security: [{ BearerAuth: [] }],
    description: 'Gets details of current logged-in user  ',
  })
  @Authorized(['admin', 'staff'])
  getUserByEmail(@CurrentUser({ required: true }) user: UserDocument) {
    return this.userService.getUserByEmail(user.email);
  }

  @Post('', { transformResponse: false })
  @OpenAPI({ description: 'Register new account ' })
  async register(@Body() registerUserDto: RegisterUserDto) {
    try {
      await this.userService.registerUser(registerUserDto);
      return {
        message: 'Success',
      };
    } catch (e) {
      throw new BadRequestError(e.message);
    }
  }

  @OpenAPI({
    security: [{ BearerAuth: [] }],
    description: 'Change password of current logged-in user',
  })
  @Authorized(['admin', 'staff'])
  @Patch('/change/password')
  async changePassword(
    @CurrentUser({ required: true }) user: UserDocument,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    try {
      await this.userService.changePassword(user._id, changePasswordDto);
      return {
        message: 'Success',
      };
    } catch (e) {
      throw new BadRequestError(e.message);
    }
  }

  @OpenAPI({
    security: [{ BearerAuth: [] }],
    description: 'Change profile (except password) of current logged-in user',
  })
  @Authorized(['admin', 'staff'])
  @Put('/change/profile')
  async changeProfile(
    @Body() changeProfileDto: ChangeProfileDto,
    @CurrentUser({ required: true }) user: UserDocument,
  ) {
    try {
      await this.userService.changeProfile(user._id, changeProfileDto);
      return {
        message: 'Success',
      };
    } catch (e) {
      throw new BadRequestError(e.message);
    }
  }

  @Get('/register/verify/:active_token')
  @OpenAPI({ description: 'Verify and active user' })
  async verify(@Param('active_token') activeToken: string) {
    try {
      return this.userService.verifyActive(activeToken);
    } catch (e) {
      throw new BadRequestError(e.message);
    }
  }

  @OpenAPI({
    description: 'Sending email with active-token link to reset password',
  })
  @Post('/forgot-password')
  async sendResetPasswordRequest(@Body() emailDto: EmailDto) {
    try {
      await this.userService.sendResetPasswordRequest(emailDto.email);
      return {
        message: 'Send reset password confirmation email success succesfully',
      };
    } catch (e) {
      throw new BadRequestError(e.message);
    }
  }

  @Get('/forgot-password/verify/:active_token')
  @OpenAPI({ description: 'Verify active_token sent to user email' })
  async verifyActiveToken(@Param('active_token') active_token: string) {
    try {
      await this.userService.verifyActiveToken(active_token);
      return {
        message: 'Verified Token Successfully',
      };
    } catch (e) {
      throw new BadRequestError(e.message);
    }
  }

  @Post('/forgot-password/updatePassword')
  @OpenAPI({ description: "Reset user's password after verified" })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    try {
      await this.userService.resetPassword(
        resetPasswordDto.active_token,
        resetPasswordDto,
      );
      return {
        message: 'Update password Successfully',
      };
    } catch (e) {
      throw new BadRequestError(e.message);
    }
  }
}
