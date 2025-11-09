import { Test, TestingModule } from '@nestjs/testing';
import { CadastroCaoService } from '../src/application/cadastro-cao/cadastro-cao.service';
import { CadastroCaoRepository } from '../src/application/cadastro-cao/repositories/cadastro-cao.repository';
import { FileUploadService } from '../src/core/services/file-upload.service';
import { UserService } from '../src/application/user/user.service';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { VideoOption, StatusCadastro } from '@prisma/client';

const mockCadastroCaoRepository = {
  findById: jest.fn(),
  update: jest.fn(),
  create: jest.fn(),
  findAll: jest.fn(),
  findByUserId: jest.fn(),
};

const mockFileUploadService = {
  getUploadConfig: jest.fn(),
  validateVideoDuration: jest.fn(),
  processUploadedFile: jest.fn(),
};

const mockUserService = {
  findUserEntityById: jest.fn(),
};

describe('CadastroCaoService - vídeo', () => {
  let service: CadastroCaoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CadastroCaoService,
        { provide: CadastroCaoRepository, useValue: mockCadastroCaoRepository },
        { provide: FileUploadService, useValue: mockFileUploadService },
        { provide: UserService, useValue: mockUserService },
      ],
    }).compile();

    service = module.get<CadastroCaoService>(CadastroCaoService);
    jest.clearAllMocks();
  });

  const existingCadastro = { cadastroId: 'cad1', id: 'cad1', userId: 'user1' } as any;

  describe('updateVideoByUpload', () => {
    it('deve lançar NotFoundException quando cadastro não existe', async () => {
      mockCadastroCaoRepository.findById.mockResolvedValue(null);
      await expect(
        service.updateVideoByUpload('cad1', 'user1', undefined),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('deve lançar ForbiddenException quando usuário não é dono', async () => {
      mockCadastroCaoRepository.findById.mockResolvedValue({ ...existingCadastro, userId: 'other' });
      await expect(
        service.updateVideoByUpload('cad1', 'user1', { mimetype: 'video/mp4' } as any),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('deve exigir arquivo de vídeo', async () => {
      mockCadastroCaoRepository.findById.mockResolvedValue(existingCadastro);
      await expect(
        service.updateVideoByUpload('cad1', 'user1', undefined),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('deve rejeitar mimetype inválido', async () => {
      mockCadastroCaoRepository.findById.mockResolvedValue(existingCadastro);
      const file = { mimetype: 'image/png' } as any;
      await expect(service.updateVideoByUpload('cad1', 'user1', file)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('deve rejeitar arquivo maior que limite configurado', async () => {
      mockCadastroCaoRepository.findById.mockResolvedValue(existingCadastro);
      mockFileUploadService.getUploadConfig.mockReturnValue({ maxFileSize: 200 * 1024 * 1024 });
      const file = { mimetype: 'video/mp4', size: 201 * 1024 * 1024, path: 'tmp.mp4' } as any;
      await expect(service.updateVideoByUpload('cad1', 'user1', file)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('deve rejeitar vídeo com duração maior que 30s', async () => {
      mockCadastroCaoRepository.findById.mockResolvedValue(existingCadastro);
      mockFileUploadService.getUploadConfig.mockReturnValue({ maxFileSize: 200 * 1024 * 1024 });
      const file = { mimetype: 'video/mp4', size: 100 * 1024, path: 'tmp.mp4' } as any;
      mockFileUploadService.validateVideoDuration.mockRejectedValue(new BadRequestException('duração'));
      await expect(service.updateVideoByUpload('cad1', 'user1', file)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('deve processar upload com sucesso, setar exclusividade e status pendente', async () => {
      mockCadastroCaoRepository.findById.mockResolvedValue(existingCadastro);
      mockFileUploadService.getUploadConfig.mockReturnValue({ maxFileSize: 200 * 1024 * 1024 });
      mockFileUploadService.validateVideoDuration.mockResolvedValue(undefined);
      mockFileUploadService.processUploadedFile.mockResolvedValue({ url: 'http://cdn/video.mp4' });
      mockCadastroCaoRepository.update.mockResolvedValue({ ...existingCadastro, videoOption: VideoOption.UPLOAD, videoUrl: 'http://cdn/video.mp4', whatsappContato: null, status: StatusCadastro.PENDENTE });

      const file = { mimetype: 'video/mp4', size: 1000, path: 'tmp.mp4' } as any;
      const result = await service.updateVideoByUpload('cad1', 'user1', file);

      expect(mockFileUploadService.processUploadedFile).toHaveBeenCalledWith(file, 'dogVideo');
      expect(mockCadastroCaoRepository.update).toHaveBeenCalledWith('cad1', expect.objectContaining({
        videoOption: VideoOption.UPLOAD,
        videoUrl: 'http://cdn/video.mp4',
        whatsappContato: undefined,
        status: StatusCadastro.PENDENTE,
      }));
      expect(result).toEqual(expect.objectContaining({ videoOption: VideoOption.UPLOAD }));
    });
  });

  describe('updateVideoOption', () => {
    it('deve rejeitar UPLOAD neste endpoint', async () => {
      mockCadastroCaoRepository.findById.mockResolvedValue(existingCadastro);
      await expect(
        service.updateVideoOption('cad1', 'user1', { videoOption: VideoOption.UPLOAD } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('URL exige videoUrl', async () => {
      mockCadastroCaoRepository.findById.mockResolvedValue(existingCadastro);
      await expect(
        service.updateVideoOption('cad1', 'user1', { videoOption: VideoOption.URL } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('URL com videoUrl deve limpar whatsappContato e chamar update', async () => {
      mockCadastroCaoRepository.findById.mockResolvedValue(existingCadastro);
      mockCadastroCaoRepository.update.mockResolvedValue({ ...existingCadastro, videoOption: VideoOption.URL, videoUrl: 'http://v', whatsappContato: null });
      const result = await service.updateVideoOption('cad1', 'user1', { videoOption: VideoOption.URL, videoUrl: 'http://v', whatsappContato: '123' } as any);
      expect(mockCadastroCaoRepository.update).toHaveBeenCalledWith('cad1', expect.objectContaining({ videoUrl: 'http://v', whatsappContato: undefined }));
      expect(result).toEqual(expect.objectContaining({ videoOption: VideoOption.URL }));
    });

    it('WHATSAPP deve limpar videoUrl', async () => {
      mockCadastroCaoRepository.findById.mockResolvedValue(existingCadastro);
      mockCadastroCaoRepository.update.mockResolvedValue({ ...existingCadastro, videoOption: VideoOption.WHATSAPP, videoUrl: null, whatsappContato: '123' });
      const result = await service.updateVideoOption('cad1', 'user1', { videoOption: VideoOption.WHATSAPP, whatsappContato: '123', videoUrl: 'x' } as any);
      expect(mockCadastroCaoRepository.update).toHaveBeenCalledWith('cad1', expect.objectContaining({ videoUrl: undefined, whatsappContato: '123' }));
      expect(result).toEqual(expect.objectContaining({ videoOption: VideoOption.WHATSAPP }));
    });

    it('NONE deve limpar ambos', async () => {
      mockCadastroCaoRepository.findById.mockResolvedValue(existingCadastro);
      mockCadastroCaoRepository.update.mockResolvedValue({ ...existingCadastro, videoOption: VideoOption.NONE, videoUrl: null, whatsappContato: null });
      const result = await service.updateVideoOption('cad1', 'user1', { videoOption: VideoOption.NONE, videoUrl: 'x', whatsappContato: 'y' } as any);
      expect(mockCadastroCaoRepository.update).toHaveBeenCalledWith('cad1', expect.objectContaining({ videoUrl: undefined, whatsappContato: undefined }));
      expect(result).toEqual(expect.objectContaining({ videoOption: VideoOption.NONE }));
    });

    it('deve lançar ForbiddenException quando usuário não é dono', async () => {
      mockCadastroCaoRepository.findById.mockResolvedValue({ ...existingCadastro, userId: 'other' });
      await expect(
        service.updateVideoOption('cad1', 'user1', { videoOption: VideoOption.URL, videoUrl: 'ok' } as any),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });
});
