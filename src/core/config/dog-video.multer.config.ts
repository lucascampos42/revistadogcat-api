import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { Request } from 'express';
import { BadRequestException } from '@nestjs/common';

export const dogVideoMulterConfig = {
  storage: diskStorage({
    destination: (req: Request, file: Express.Multer.File, cb: Function) => {
      const uploadPath = join(process.cwd(), 'uploads', 'dogs', 'videos');
      cb(null, uploadPath);
    },
    filename: (req: Request, file: Express.Multer.File, cb: Function) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const fileExtension = extname(file.originalname);
      cb(null, `dog-video-${uniqueSuffix}${fileExtension}`);
    },
  }),
  fileFilter: (req: Request, file: Express.Multer.File, cb: Function) => {
    const allowedMimeTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/quicktime'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new BadRequestException('Apenas arquivos de vídeo são permitidos (mp4, mov, avi, quicktime)'), false);
    }
  },
  limits: {
    fileSize: 200 * 1024 * 1024, // 200MB
  },
};
