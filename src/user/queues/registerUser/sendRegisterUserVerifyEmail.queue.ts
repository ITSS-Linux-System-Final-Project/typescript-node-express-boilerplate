import Bull, { Queue } from 'bull';
import { sendRegisterUserVerifyEmailProcessor } from './sendRegisterUserVerifyEmail.processor';

export type sendRegisterUserVerifyEmail = {
  user_email: string,
  user_fullname:string,
  redirect_link:string
};

export const sendRegisterUserVerifyEmailQueue: Queue<sendRegisterUserVerifyEmail> = new Bull(
  'send-register-user-verify-email',
  {
    redis: {
      port: Number.parseInt(process.env.REDIS_PORT, 10),
      host: process.env.REDIS_HOST,
    },
  },
);

sendRegisterUserVerifyEmailQueue.process(sendRegisterUserVerifyEmailProcessor);
