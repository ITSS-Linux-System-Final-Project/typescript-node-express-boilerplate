import { Job } from 'bull';
import { BadRequestError } from 'routing-controllers';
import { sendRegisterUserVerifyEmail } from './sendRegisterUserVerifyEmail.queue';
import { Mailer } from '../../../utils/mailer';

export async function sendRegisterUserVerifyEmailProcessor(
  job: Job<sendRegisterUserVerifyEmail>,
): Promise<void> {
  try {
    const { data } = job;
    const { user_email, user_fullname, redirect_link } = data;
    await Mailer.registerConfirmation(user_email, user_fullname, redirect_link);
  } catch (e) {
    throw new BadRequestError(e.message);
  }
}
