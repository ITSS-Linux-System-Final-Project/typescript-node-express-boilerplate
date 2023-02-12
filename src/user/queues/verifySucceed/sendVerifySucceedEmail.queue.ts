import Bull, { Queue } from 'bull';
import { sendVerifySucceedEmailProcessor } from './sendVerifySucceedEmail.processor';

export type sendVerifySucceedEmail = {
  user_email: string,
  user_fullname:string,
};

export const sendVerifySucceedEmailQueue: Queue<sendVerifySucceedEmail> = new Bull(
  'send-verify-succeed-email',
  {
    redis: {
      port: Number.parseInt(process.env.REDIS_PORT, 10),
      host: process.env.REDIS_HOST,
    },
  },
);

sendVerifySucceedEmailQueue.process(sendVerifySucceedEmailProcessor);
