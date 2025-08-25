import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { Request } from 'express';
import { BadRequestException } from '@nestjs/common';

// Configuração do multer para upload de avatares
export const multerConfig = {
  storage: diskStorage({
    destination: (req: Request, file: Express.Multer.File, cb: Function) => {
      // Diretório onde os arquivos serão salvos
      const uploadPath = join(process.cwd(), 'uploads', 'avatars');
      cb(null, uploadPath);
    },
    filename: (req: Request, file: Express.Multer.File, cb: Function) => {
      // Nome do arquivo: timestamp + extensão original
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const fileExtension = extname(file.originalname);
      cb(null, `avatar-${uniqueSuffix}${fileExtension}`);
    },
  }),
  fileFilter: (req: Request, file: Express.Multer.File, cb: Function) => {
    // Aceitar apenas imagens
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new BadRequestException('Apenas arquivos de imagem são permitidos (JPEG, PNG, WebP)'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
};