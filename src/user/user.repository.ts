import { hashSync, compareSync } from 'bcrypt';
import { BadRequestError } from 'routing-controllers';
import { v4 as uuidv4 } from 'uuid';
import { UserDocument, UserModel } from './user.model';
import { ChangeProfileDto } from './dtos/changeProfile.dto';
import { ChangePasswordDto } from './dtos/changePassword.dto';
import { ResetPasswordDto } from './dtos/resetPassword.dto';
import { Mailer } from '../utils/mailer';
import { RegisterUserDto } from './dtos/registerUser.dto';
import { sendRegisterUserVerifyEmailQueue } from './queues/registerUser/sendRegisterUserVerifyEmail.queue';
import { UserStatus } from './enums/user-status.enum';
import { sendVerifySucceedEmailQueue } from './queues/verifySucceed/sendVerifySucceedEmail.queue';

export class UserRepository {
  private hashPassword(password: string, rounds: number): string {
    return hashSync(password, rounds);
  }

  private comparePassword(password: string, hashedPassword: string): boolean {
    return compareSync(password, hashedPassword);
  }

  async getUserByEmail(email: string): Promise<UserDocument | null> {
    return UserModel.findOne({ email, del_flag: false })
      .lean();
  }

  async register(createUserDto: RegisterUserDto): Promise<void> {
    const hashed_password = this.hashPassword(createUserDto.password, 10);
    const del_flag = false;
    const status = UserStatus.NEW;
    const create_time = new Date();
    const active_token = uuidv4();

    const user = new UserModel({
      ...createUserDto,
      hashed_password,
      del_flag,
      status,
      create_time,
      active_token,
    });
    const userCreated = await user.save();
    if (userCreated) {
      await sendRegisterUserVerifyEmailQueue.add({
        user_email: userCreated.email,
        user_fullname: userCreated.fullname,
        redirect_link: `${process.env.WEBSITE_DOMAIN_PATH}/user/register/verify/${userCreated.active_token}`,
      });
    }
  }

  async changeProfile(
    user_id: string,
    changeProfileDto: ChangeProfileDto,
  ) {
    const query = { _id: user_id, del_flag: false };
    const modifyingUser = await UserModel.findOne(query).exec();
    modifyingUser.fullname = changeProfileDto.fullname;
    if (changeProfileDto.phone) modifyingUser.phone = changeProfileDto.phone;
    modifyingUser.birthday = changeProfileDto.birthday;
    modifyingUser.address = changeProfileDto.address;
    await modifyingUser.save();
  }

  async changePassword(user_id: string, changePasswordDto: ChangePasswordDto) {
    const query = { _id: user_id, del_flag: false };
    const { old_password, new_password } = changePasswordDto;
    if (old_password === new_password) {
      throw new BadRequestError(
        'New Password must be different with Old Password',
      );
    } else {
      try {
        const new_hashed_password = this.hashPassword(
          changePasswordDto.new_password,
          10,
        );
        const user = await UserModel.findOne(query)
          .select({
            _id: 0,
            hashed_password: 1,
          })
          .lean();
        if (!this.comparePassword(old_password, user.hashed_password)) {
          throw new Error('Old Password is incorrect');
        } else {
          await UserModel.findOneAndUpdate(query, {
            hashed_password: new_hashed_password,
          });
        }
      } catch (e) {
        throw new BadRequestError(e.message);
      }
    }
  }

  async sendResetPasswordRequest(user_email: string) {
    const user = await UserModel.findOne({
      email: user_email,
      status: { $in: [1, 2] },
      del_flag: false,
    });
    if (!user) {
      throw new BadRequestError('User not found !');
    }
    const otp_active_token = uuidv4();
    user.active_token = otp_active_token;
    await Mailer.resetPassword(user.email, user.fullname, otp_active_token);
    await user.save();
  }

  async verifyActive(active_token: string) {
    try {
      const user = await UserModel.findOneAndUpdate(
        {
          active_token,
          del_flag: false,
        },
        {
          status: UserStatus.ACTIVE,
          active_token: uuidv4(),
        },
      );
      if (!user) {
        throw new BadRequestError(
          'Activation unsuccesfully : invalid ActiveToken or user has been activated before! This error will also be thrown in the case that user has been deleted !',
        );
      }
      await sendVerifySucceedEmailQueue.add({
        user_email: user.email,
        user_fullname: user.fullname,
      });
      return 'Kích hoạt tài khoản thành công';
    } catch (e) {
      throw new BadRequestError(e.message);
    }
  }

  async verifyActiveToken(active_token: string) {
    try {
      const user = await UserModel.findOne({
        active_token,
        del_flag: false,
        status: 1,
      });
      if (!user) {
        throw new BadRequestError(
          'This active_token does not exist or user does not exist !',
        );
      }
    } catch (e) {
      throw new BadRequestError(e.message);
    }
  }

  async resetPassword(
    active_token: string,
    resetPasswordDto: ResetPasswordDto,
  ) {
    const user = await UserModel.findOne({
      active_token,
      del_flag: false,
      status: 1,
    });
    if (!user) {
      throw new BadRequestError(
        'This active_token does not exist or user does not exist !',
      );
    }
    const { new_password, confirm_new_password } = resetPasswordDto;
    if (new_password !== confirm_new_password) {
      throw new BadRequestError('Confirmation password must equal to password');
    }
    const new_hashed_password = this.hashPassword(new_password, 10);
    user.hashed_password = new_hashed_password;
    user.active_token = uuidv4();
    await user.save();
  }
}
