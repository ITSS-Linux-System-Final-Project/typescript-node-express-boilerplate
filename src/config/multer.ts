import multer from 'multer';
import { resolve } from 'path';

export const fileUploadOptions = {
  storage: multer.diskStorage({
    destination: resolve(__dirname, '../../files'),
    filename(req, file, cb) {
      cb(null, `${file.originalname}`);
    },
  }),
  limits: {
    files: 5, // allow up to 5 files per request,
  },
};
