import { createReadStream, unlink } from 'fs';
import { Job } from 'bull';
import axios from 'axios';
import FormData from 'form-data';
import { BadRequestError, HttpError } from 'routing-controllers';
import { sendVerifySucceedEmail } from './sendVerifySucceedEmail.queue';
import { Mailer } from '../../../utils/mailer';

export async function sendVerifySucceedEmailProcessor(
  job: Job<sendVerifySucceedEmail>,
): Promise<void> {
  try {
    const { data } = job;
    const { user_email, user_fullname } = data;
    await Mailer.verifySucceed(user_email, user_fullname);
  } catch (e) {
    throw new BadRequestError(e.message);
  }
}
