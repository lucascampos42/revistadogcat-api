import { Injectable, BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { Request } from 'express';
import { existsSync, mkdirSync } from 'fs';
import * as sharp from 'sharp';

export interface FileUploadConfig {
  destination: string;
  allowedMimeTypes: string[];
  maxFileSize: number;
  fileNamePrefix?: string;
  imageResize?: {
    width?: number;
    height?: number;
    fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  };
}

export interface UploadedFileResult {
  url: string;
  filename: string;
  originalName: string;
  size: number;
  mimetype: string;
}

@Injectable()
export class FileUploadService {
  /**
   * Configurações predefinidas para diferentes tipos de upload
   */
  private readonly uploadConfigs = {
    avatar: {
      destination: 'uploads/avatars',
      allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
      maxFileSize: 5 * 1024 * 1024, // 5MB
      fileNamePrefix: 'avatar',
      imageResize: { width: 400, height: 400, fit: 'cover' as const },
    },
    articleImage: {
      destination: 'uploads/articles',
      allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
      maxFileSize: 5 * 1024 * 1024, // 5MB
      fileNamePrefix: 'article',
    },
    dogProfile: {
      destination: 'uploads/dogs/profile',
      allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
      maxFileSize: 5 * 1024 * 1024, // 5MB
      fileNamePrefix: 'dog-profile',
      imageResize: { width: 400, height: 400, fit: 'cover' as const },
    },
    dogLateral: {
      destination: 'uploads/dogs/lateral',
      allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
      maxFileSize: 5 * 1024 * 1024, // 5MB
      fileNamePrefix: 'dog-lateral',
      imageResize: { width: 600, height: 400, fit: 'cover' as const },
    },
    dogPedigree: {
      destination: 'uploads/dogs/pedigree',
      allowedMimeTypes: [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'application/pdf',
      ],
      maxFileSize: 10 * 1024 * 1024, // 10MB
      fileNamePrefix: 'pedigree',
    },
    dogVideo: {
      destination: 'uploads/dogs/videos',
      allowedMimeTypes: [
        'video/mp4',
        'video/mov',
        'video/avi',
        'video/quicktime',
      ],
      maxFileSize: 50 * 1024 * 1024, // 50MB
      fileNamePrefix: 'dog-video',
    },
    magazinePdf: {
      destination: 'uploads/revista',
      allowedMimeTypes: ['application/pdf'],
      maxFileSize: 50 * 1024 * 1024, // 50MB
      fileNamePrefix: 'revista',
    },
    magazineCover: {
      destination: 'uploads/revista/capas',
      allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
      maxFileSize: 5 * 1024 * 1024, // 5MB
      fileNamePrefix: 'revista-capa',
      imageResize: { width: 800, height: 600, fit: 'cover' as const },
    },
  };

  /**
   * Cria configuração do multer para um tipo específico de upload
   */
  createMulterConfig(uploadType: keyof typeof this.uploadConfigs) {
    const config = this.uploadConfigs[uploadType];

    return {
      storage: diskStorage({
        destination: (
          req: Request,
          file: Express.Multer.File,
          cb: Function,
        ) => {
          const uploadPath = join(process.cwd(), config.destination);
          this.ensureDirectoryExists(uploadPath);
          cb(null, uploadPath);
        },
        filename: (req: Request, file: Express.Multer.File, cb: Function) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const fileExtension = extname(file.originalname);
          const prefix = config.fileNamePrefix || 'file';
          cb(null, `${prefix}-${uniqueSuffix}${fileExtension}`);
        },
      }),
      fileFilter: (req: Request, file: Express.Multer.File, cb: Function) => {
        if (config.allowedMimeTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          const allowedTypes = config.allowedMimeTypes.join(', ');
          cb(
            new BadRequestException(
              `Tipo de arquivo não suportado. Tipos permitidos: ${allowedTypes}`,
            ),
            false,
          );
        }
      },
      limits: {
        fileSize: config.maxFileSize,
      },
    };
  }

  /**
   * Processa arquivo após upload (redimensionamento de imagens, etc.)
   */
  async processUploadedFile(
    file: Express.Multer.File,
    uploadType: keyof typeof this.uploadConfigs,
  ): Promise<UploadedFileResult> {
    const config = this.uploadConfigs[uploadType];

    // Se é uma imagem e tem configuração de redimensionamento
    if (
      'imageResize' in config &&
      config.imageResize &&
      file.mimetype.startsWith('image/')
    ) {
      await this.resizeImage(file.path, config.imageResize);
    }

    // Construir URL baseada no caminho do arquivo
    const relativePath = file.path
      .replace(process.cwd(), '')
      .replace(/\\/g, '/');
    const url = relativePath.startsWith('/')
      ? relativePath
      : `/${relativePath}`;

    return {
      url,
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  /**
   * Redimensiona uma imagem usando Sharp
   */
  private async resizeImage(
    filePath: string,
    resizeConfig: NonNullable<FileUploadConfig['imageResize']>,
  ): Promise<void> {
    try {
      await sharp(filePath)
        .resize({
          width: resizeConfig.width,
          height: resizeConfig.height,
          fit: resizeConfig.fit || 'cover',
        })
        .jpeg({ quality: 90 })
        .toFile(filePath.replace(extname(filePath), '_resized.jpg'));

      // Substituir arquivo original pelo redimensionado
      const fs = require('fs');
      fs.renameSync(
        filePath.replace(extname(filePath), '_resized.jpg'),
        filePath,
      );
    } catch (error) {
      console.error('Erro ao redimensionar imagem:', error);
      // Continuar sem redimensionar se houver erro
    }
  }

  /**
   * Garante que o diretório existe, criando-o se necessário
   */
  private ensureDirectoryExists(dirPath: string): void {
    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true });
    }
  }

  /**
   * Valida múltiplos arquivos
   */
  validateMultipleFiles(
    files: Express.Multer.File[],
    uploadType: keyof typeof this.uploadConfigs,
  ): void {
    const config = this.uploadConfigs[uploadType];

    for (const file of files) {
      if (!config.allowedMimeTypes.includes(file.mimetype)) {
        throw new BadRequestException(
          `Arquivo ${file.originalname} tem tipo não suportado: ${file.mimetype}`,
        );
      }

      if (file.size > config.maxFileSize) {
        throw new BadRequestException(
          `Arquivo ${file.originalname} excede o tamanho máximo permitido`,
        );
      }
    }
  }

  /**
   * Obtém configuração para um tipo de upload
   */
  getUploadConfig(
    uploadType: keyof typeof this.uploadConfigs,
  ): FileUploadConfig {
    return this.uploadConfigs[uploadType];
  }

  /**
   * Lista todos os tipos de upload disponíveis
   */
  getAvailableUploadTypes(): string[] {
    return Object.keys(this.uploadConfigs);
  }
}
