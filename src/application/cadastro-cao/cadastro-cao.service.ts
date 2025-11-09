import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { CadastroCaoRepository } from './repositories/cadastro-cao.repository';
import { CreateCadastroCaoDto } from './dto/create-cadastro-cao.dto';
import { UpdateCadastroCaoDto } from './dto/update-cadastro-cao.dto';
import {
  ListCadastrosCaoDto,
  CadastrosCaoListResponseDto,
} from './dto/list-cadastros-cao.dto';
import { CadastroCaoResponseDto } from './dto/cadastro-cao-response.dto';
import { CadastroCaoEntity } from './entities/cadastro-cao.entity';
import { VideoOption, StatusCadastro } from '@prisma/client';
import { UserService } from '../user/user.service';
import { FileUploadService } from '../../core/services/file-upload.service';

@Injectable()
export class CadastroCaoService {
  constructor(
    private readonly cadastroCaoRepository: CadastroCaoRepository,
    private readonly userService: UserService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  async create(
    requesterId: string,
    createCadastroCaoDto: CreateCadastroCaoDto,
    fotoPerfil: Express.Multer.File | undefined,
    fotoLateral: Express.Multer.File | undefined,
    pedigreeFrente?: Express.Multer.File,
    pedigreeVerso?: Express.Multer.File,
  ): Promise<CadastroCaoResponseDto> {
    let proprietarioFinalId: string;

    if (!fotoPerfil) {
      throw new BadRequestException('A foto de perfil Ã© obrigatÃ³ria.');
    }

    if (!fotoLateral) {
      throw new BadRequestException('A foto lateral Ã© obrigatÃ³ria.');
    }

    if (createCadastroCaoDto.proprietarioId) {
      const proprietario = await this.userService.findUserEntityById(
        createCadastroCaoDto.proprietarioId,
      );
      if (!proprietario) {
        throw new BadRequestException(
          `ProprietÃ¡rio com ID '${createCadastroCaoDto.proprietarioId}' nÃ£o encontrado.`,
        );
      }
      proprietarioFinalId = createCadastroCaoDto.proprietarioId;
    } else {
      proprietarioFinalId = requesterId;
    }

    const dataNascimento = new Date(createCadastroCaoDto.dataNascimento);
    if (isNaN(dataNascimento.getTime())) {
      throw new BadRequestException('Data de nascimento invÃ¡lida');
    }
    if (dataNascimento > new Date()) {
      throw new BadRequestException(
        'Data de nascimento nÃ£o pode ser no futuro',
      );
    }

    if (
      (!createCadastroCaoDto.racaId && !createCadastroCaoDto.racaSugerida) ||
      (createCadastroCaoDto.racaId && createCadastroCaoDto.racaSugerida)
    ) {
      throw new BadRequestException(
        'VocÃª deve fornecer ou um `racaId` de uma raÃ§a existente ou uma `racaSugerida`, mas nÃ£o ambos.',
      );
    }

    const normalizeBoolean = (val: any): boolean | undefined => {
      if (val === undefined || val === null || val === '') return undefined;
      if (typeof val === 'boolean') return val;
      if (typeof val === 'string') {
        const v = val.trim().toLowerCase();
        if (v === 'true') return true;
        if (v === 'false') return false;
      }
      return Boolean(val);
    };

    createCadastroCaoDto.temPedigree = normalizeBoolean(
      createCadastroCaoDto.temPedigree,
    );
    createCadastroCaoDto.temMicrochip = normalizeBoolean(
      createCadastroCaoDto.temMicrochip,
    );

    createCadastroCaoDto.videoOption = VideoOption.NONE;
    createCadastroCaoDto.videoUrl = undefined;
    createCadastroCaoDto.whatsappContato = undefined;

    this.validateConditionalData(createCadastroCaoDto);

    if (!fotoPerfil) {
      throw new BadRequestException(
        'Foto de perfil do cÃ£o (fotoPerfil) Ã© obrigatÃ³ria.',
      );
    }
    if (!fotoLateral) {
      throw new BadRequestException(
        'Foto lateral do cÃ£o (fotoLateral) Ã© obrigatÃ³ria.',
      );
    }

    const cadastro = await this.cadastroCaoRepository.create(
      proprietarioFinalId,
      {
        ...createCadastroCaoDto,
        fotoPerfil: 'placeholder.jpg',
        fotoLateral: 'placeholder.jpg',
      },
      StatusCadastro.PENDENTE,
    );

    this.processMediaInBackground(
      cadastro.cadastroId,
      fotoPerfil,
      fotoLateral,
      pedigreeFrente,
      pedigreeVerso,
      undefined,
    );

    return this.mapToResponseDto(cadastro);
  }

  async findAll(
    listCadastrosCaoDto: ListCadastrosCaoDto,
  ): Promise<CadastrosCaoListResponseDto> {
    const { data, total } =
      await this.cadastroCaoRepository.findAll(listCadastrosCaoDto);

    const page = parseInt(listCadastrosCaoDto.page || '1');
    const limit = Math.min(parseInt(listCadastrosCaoDto.limit || '10'), 50);
    const totalPages = Math.ceil(total / limit);

    return {
      data: data.map((cadastro) => this.mapToResponseDto(cadastro)),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async findOne(cadastroId: string): Promise<CadastroCaoResponseDto> {
    const cadastro = await this.cadastroCaoRepository.findById(cadastroId);

    if (!cadastro) {
      throw new NotFoundException('Cadastro de cÃ£o nÃ£o encontrado');
    }

    return this.mapToResponseDto(cadastro);
  }

  async findByUser(userId: string): Promise<CadastroCaoResponseDto[]> {
    const cadastros = await this.cadastroCaoRepository.findByUserId(userId);
    return cadastros.map((cadastro) => this.mapToResponseDto(cadastro));
  }

  async update(
    cadastroId: string,
    userId: string,
    updateCadastroCaoDto: UpdateCadastroCaoDto,
  ): Promise<CadastroCaoResponseDto> {
    const existingCadastro =
      await this.cadastroCaoRepository.findById(cadastroId);

    if (!existingCadastro) {
      throw new NotFoundException('Cadastro de cÃ£o nÃ£o encontrado');
    }

    if (existingCadastro.userId !== userId) {
      throw new ForbiddenException(
        'VocÃª nÃ£o tem permissÃ£o para editar este cadastro',
      );
    }

    this.validateConditionalData(updateCadastroCaoDto);

    const cadastro = await this.cadastroCaoRepository.update(
      cadastroId,
      updateCadastroCaoDto,
    );
    return this.mapToResponseDto(cadastro);
  }

  async updateVideoByUpload(
    cadastroId: string,
    userId: string,
    video?: Express.Multer.File,
  ): Promise<CadastroCaoResponseDto> {
    const existingCadastro =
      await this.cadastroCaoRepository.findById(cadastroId);

    if (!existingCadastro) {
      throw new NotFoundException('Cadastro de cÃ£o nÃ£o encontrado');
    }

    if (existingCadastro.userId !== userId) {
      throw new ForbiddenException(
        'VocÃª nÃ£o tem permissÃ£o para editar este cadastro',
      );
    }

    if (!video) {
      throw new BadRequestException('Arquivo de vÃ­deo Ã© obrigatÃ³rio');
    }

    if (!video.mimetype?.startsWith('video/')) {
      throw new BadRequestException('Tipo de arquivo invÃ¡lido para vÃ­deo');
    }
    // Validação de tamanho máximo (fallback caso Multer não esteja configurado)
    const uploadCfg = this.fileUploadService.getUploadConfig('dogVideo');
        if (video.size > uploadCfg.maxFileSize) {
      const maxMB = Math.floor(uploadCfg.maxFileSize / (1024 * 1024));
      throw new BadRequestException(`Arquivo de vídeo excede o tamanho máximo permitido de ${maxMB}MB`);
    }

    // Validação de duração máxima de 30s
    await this.fileUploadService.validateVideoDuration(video.path, 30);

    const processed = await this.fileUploadService.processUploadedFile(
      video,
      'dogVideo',
    );

    const cadastroAtualizado = await this.cadastroCaoRepository.update(
      cadastroId,
      {
        videoOption: VideoOption.UPLOAD,
        videoUrl: processed?.url,
        whatsappContato: undefined,
        status: StatusCadastro.PENDENTE,
      },
    );

    return this.mapToResponseDto(cadastroAtualizado);
  }

  /**
   * Atualiza opção de vídeo (URL/WHATSAPP/NONE) com exclusividade e limpeza de campos não relacionados.
   */
  async updateVideoOption(
    cadastroId: string,
    userId: string,
    updateCadastroCaoDto: UpdateCadastroCaoDto,
  ): Promise<CadastroCaoResponseDto> {
    const existingCadastro = await this.cadastroCaoRepository.findById(cadastroId);
    if (!existingCadastro) {
      throw new NotFoundException('Cadastro de cão não encontrado');
    }
    if (existingCadastro.userId !== userId) {
      throw new ForbiddenException('Você não tem permissão para editar este cadastro');
    }

    if (updateCadastroCaoDto.videoOption === VideoOption.UPLOAD) {
      throw new BadRequestException('Envio de arquivo não é aceito neste endpoint. Utilize /cadastro-cao/:id/video/upload');
    }

    // Exclusividade e regras
    if (updateCadastroCaoDto.videoOption === VideoOption.URL) {
      if (!updateCadastroCaoDto.videoUrl) {
        throw new BadRequestException('videoUrl é obrigatório quando videoOption=URL');
      }
      updateCadastroCaoDto.whatsappContato = undefined;
    } else if (updateCadastroCaoDto.videoOption === VideoOption.WHATSAPP) {
      updateCadastroCaoDto.videoUrl = undefined;
    } else if (updateCadastroCaoDto.videoOption === VideoOption.NONE) {
      updateCadastroCaoDto.videoUrl = undefined;
      updateCadastroCaoDto.whatsappContato = undefined;
    }

    this.validateConditionalData(updateCadastroCaoDto);

    const cadastro = await this.cadastroCaoRepository.update(cadastroId, updateCadastroCaoDto);
    return this.mapToResponseDto(cadastro);
  }
  async remove(cadastroId: string, userId: string): Promise<void> {
    const cadastro = await this.cadastroCaoRepository.findById(cadastroId);

    if (!cadastro) {
      throw new NotFoundException('Cadastro de cÃ£o nÃ£o encontrado');
    }

    if (cadastro.userId !== userId) {
      throw new ForbiddenException(
        'VocÃª nÃ£o tem permissÃ£o para excluir este cadastro',
      );
    }

    await this.cadastroCaoRepository.delete(cadastroId);
  }

  async findByRaca(
    raca: string,
    limit: number,
  ): Promise<CadastroCaoResponseDto[]> {
    const cadastros = await this.cadastroCaoRepository.findByRaca(raca, limit);
    return cadastros.map(this.mapToResponseDto);
  }

  async findBySexo(
    sexo: string,
    limit: number,
  ): Promise<CadastroCaoResponseDto[]> {
    const cadastros = await this.cadastroCaoRepository.findBySexo(sexo, limit);
    return cadastros.map(this.mapToResponseDto);
  }

  async findComPedigree(): Promise<CadastroCaoResponseDto[]> {
    const cadastros = await this.cadastroCaoRepository.findComPedigree();
    return cadastros.map(this.mapToResponseDto);
  }

  async findComMicrochip(): Promise<CadastroCaoResponseDto[]> {
    const cadastros = await this.cadastroCaoRepository.findComMicrochip();
    return cadastros.map(this.mapToResponseDto);
  }

  async findComVideo(): Promise<CadastroCaoResponseDto[]> {
    const cadastros = await this.cadastroCaoRepository.findComVideo();
    return cadastros.map(this.mapToResponseDto);
  }

  async findRecentCadastros(limit: number): Promise<CadastroCaoResponseDto[]> {
    const cadastros =
      await this.cadastroCaoRepository.findRecentCadastros(limit);
    return cadastros.map(this.mapToResponseDto);
  }

  async getUserCadastrosCount(userId: string): Promise<number> {
    return this.cadastroCaoRepository.countByUserId(userId);
  }

  private validateConditionalData(
    data: CreateCadastroCaoDto | UpdateCadastroCaoDto,
  ): void {
    if (data.temPedigree === true) {
      if (!data.registroPedigree) {
        throw new BadRequestException(
          'Registro do pedigree Ã© obrigatÃ³rio quando o cÃ£o tem pedigree',
        );
      }
    }

    if (data.temMicrochip === true) {
      if (!data.numeroMicrochip) {
        throw new BadRequestException(
          'NÃºmero do microchip Ã© obrigatÃ³rio quando o cÃ£o tem microchip',
        );
      }
    }

    if (data.videoOption) {
      if (data.videoOption === VideoOption.URL) {
        if (!data.videoUrl) {
          throw new BadRequestException(
            'URL do vÃ­deo Ã© obrigatÃ³ria quando a opÃ§Ã£o selecionada for URL',
          );
        }
      }

      // Quando a opÃ§Ã£o de vÃ­deo for WHATSAPP, nÃ£o exigimos mais o contato.
      // Basta marcar que o envio serÃ¡ feito por WhatsApp.
      // ObservaÃ§Ã£o: Se necessÃ¡rio, a UI pode deduzir WHATSAPP quando nÃ£o houver
      // arquivo de vÃ­deo nem link fornecido na etapa de envio de vÃ­deo.
    }
  }

  private mapToResponseDto(
    cadastro: CadastroCaoEntity,
  ): CadastroCaoResponseDto {
    return {
      cadastroId: cadastro.cadastroId,
      userId: cadastro.userId,
      nome: cadastro.nome,
      raca: cadastro.raca ? cadastro.raca.nome : undefined,
      racaSugerida: cadastro.racaSugerida || undefined,
      sexo: cadastro.sexo,
      dataNascimento: cadastro.dataNascimento,
      fotoPerfil: cadastro.fotoPerfil,
      fotoLateral: cadastro.fotoLateral,
      peso: cadastro.peso || undefined,
      altura: cadastro.altura || undefined,
      temPedigree: cadastro.temPedigree,
      registroPedigree: cadastro.registroPedigree || undefined,
      pedigreeFrente: cadastro.pedigreeFrente || undefined,
      pedigreeVerso: cadastro.pedigreeVerso || undefined,
      temMicrochip: cadastro.temMicrochip,
      numeroMicrochip: cadastro.numeroMicrochip || undefined,
      titulos: cadastro.titulos || undefined,
      caracteristicas: cadastro.caracteristicas || undefined,
      videoOption: cadastro.videoOption,
      videoUrl: cadastro.videoUrl || undefined,
      whatsappContato: cadastro.whatsappContato || undefined,
      observacoes: cadastro.observacoes || undefined,
      createdAt: cadastro.createdAt,
      updatedAt: cadastro.updatedAt,
      status: cadastro.status,
      motivoRejeicao: cadastro.motivoRejeicao || undefined,
      aprovadoPor: cadastro.aprovadoPor || undefined,
      aprovadoEm: cadastro.aprovadoEm || undefined,
      ativo: cadastro.ativo,
      totalVotos: cadastro.totalVotos,
    };
  }

  async aprovarCadastro(
    cadastroId: string,
    aprovadoPor: string,
  ): Promise<CadastroCaoResponseDto> {
    const cadastro = await this.cadastroCaoRepository.findById(cadastroId);
    if (!cadastro) {
      throw new NotFoundException('Cadastro de cÃ£o nÃ£o encontrado');
    }

    if (cadastro.status !== 'PENDENTE') {
      throw new BadRequestException(
        'Apenas cadastros pendentes podem ser aprovados',
      );
    }

    const cadastroAprovado = await this.cadastroCaoRepository.aprovarCadastro(
      cadastroId,
      aprovadoPor,
    );

    return this.mapToResponseDto(cadastroAprovado);
  }

  private async processMediaInBackground(
    cadastroId: string,
    fotoPerfil: Express.Multer.File,
    fotoLateral: Express.Multer.File,
    pedigreeFrente?: Express.Multer.File,
    pedigreeVerso?: Express.Multer.File,
    video?: Express.Multer.File,
  ): Promise<void> {
    try {
      const [
        fotoPerfilUrl,
        fotoLateralUrl,
        pedigreeFrenteUrl,
        pedigreeVersoUrl,
        videoUrl,
      ] = await Promise.all([
        this.fileUploadService.processUploadedFile(fotoPerfil, 'dogProfile'),
        this.fileUploadService.processUploadedFile(fotoLateral, 'dogLateral'),
        pedigreeFrente
          ? this.fileUploadService.processUploadedFile(
              pedigreeFrente,
              'dogPedigree',
            )
          : Promise.resolve(undefined),
        pedigreeVerso
          ? this.fileUploadService.processUploadedFile(
              pedigreeVerso,
              'dogPedigree',
            )
          : Promise.resolve(undefined),
        video ? (async () => { await this.fileUploadService.validateVideoDuration(video.path, 30); return this.fileUploadService.processUploadedFile(video, 'dogVideo'); })() : Promise.resolve(undefined),
      ]);

      await this.cadastroCaoRepository.update(cadastroId, {
        fotoPerfil: fotoPerfilUrl?.url,
        fotoLateral: fotoLateralUrl?.url,
        pedigreeFrente: pedigreeFrenteUrl?.url,
        pedigreeVerso: pedigreeVersoUrl?.url,
        videoUrl: videoUrl?.url,
        status: 'PENDENTE',
      });
    } catch (error) {
      console.error(
        `Erro ao processar mÃ­dia para o cadastro ${cadastroId}:`,
        error,
      );
      await this.cadastroCaoRepository.update(cadastroId, {
        status: 'REJEITADO',
        motivoRejeicao: 'Erro no processamento de mÃ­dia.',
      });
    }
  }

  async rejeitarCadastro(
    cadastroId: string,
    motivoRejeicao: string,
    aprovadoPor: string,
  ): Promise<CadastroCaoResponseDto> {
    const cadastro = await this.cadastroCaoRepository.findById(cadastroId);
    if (!cadastro) {
      throw new NotFoundException('Cadastro de cÃ£o nÃ£o encontrado');
    }

    if (cadastro.status !== 'PENDENTE') {
      throw new BadRequestException(
        'Apenas cadastros pendentes podem ser rejeitados',
      );
    }

    if (!motivoRejeicao || motivoRejeicao.trim() === '') {
      throw new BadRequestException('Motivo da rejeiÃ§Ã£o Ã© obrigatÃ³rio');
    }

    const cadastroRejeitado = await this.cadastroCaoRepository.rejeitarCadastro(
      cadastroId,
      motivoRejeicao,
      aprovadoPor,
    );

    return this.mapToResponseDto(cadastroRejeitado);
  }

  async countPendentesValidacao(): Promise<number> {
    return this.cadastroCaoRepository.countPendentesValidacao();
  }

  async findPendentesValidacao(
    limit: number = 50,
  ): Promise<CadastroCaoResponseDto[]> {
    const cadastros =
      await this.cadastroCaoRepository.findPendentesValidacao(limit);
    return cadastros.map((cadastro) => this.mapToResponseDto(cadastro));
  }

  async findPendentesRaca(
    limit: number = 50,
  ): Promise<CadastroCaoResponseDto[]> {
    const cadastros = await this.cadastroCaoRepository.findPendentesRaca(limit);
    return cadastros.map((cadastro) => this.mapToResponseDto(cadastro));
  }
}



