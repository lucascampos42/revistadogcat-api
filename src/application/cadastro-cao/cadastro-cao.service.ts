import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
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
import { VideoOption } from '@prisma/client';
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
    video?: Express.Multer.File,
  ): Promise<CadastroCaoResponseDto> {
    let proprietarioFinalId: string;

    if (!fotoPerfil) {
      throw new BadRequestException('A foto de perfil é obrigatória.');
    }

    if (!fotoLateral) {
      throw new BadRequestException('A foto lateral é obrigatória.');
    }

    if (createCadastroCaoDto.proprietarioId) {
      const proprietario = await this.userService.findUserEntityById(
        createCadastroCaoDto.proprietarioId,
      );
      if (!proprietario) {
        throw new BadRequestException(
          `Proprietário com ID '${createCadastroCaoDto.proprietarioId}' não encontrado.`,
        );
      }
      proprietarioFinalId = createCadastroCaoDto.proprietarioId;
    } else {
      proprietarioFinalId = requesterId;
    }

    const dataNascimento = new Date(createCadastroCaoDto.dataNascimento);
    if (isNaN(dataNascimento.getTime())) {
      throw new BadRequestException('Data de nascimento inválida');
    }
    if (dataNascimento > new Date()) {
      throw new BadRequestException(
        'Data de nascimento não pode ser no futuro',
      );
    }

    if (
      (!createCadastroCaoDto.racaId && !createCadastroCaoDto.racaSugerida) ||
      (createCadastroCaoDto.racaId && createCadastroCaoDto.racaSugerida)
    ) {
      throw new BadRequestException(
        'Você deve fornecer ou um `racaId` de uma raça existente ou uma `racaSugerida`, mas não ambos.',
      );
    }

    this.validateConditionalData(createCadastroCaoDto);

    // Garantir que as fotos obrigatórias foram enviadas
    if (!fotoPerfil) {
      throw new BadRequestException(
        'Foto de perfil do cão (fotoPerfil) é obrigatória.',
      );
    }
    if (!fotoLateral) {
      throw new BadRequestException(
        'Foto lateral do cão (fotoLateral) é obrigatória.',
      );
    }

    const cadastro = await this.cadastroCaoRepository.create(
      proprietarioFinalId,
      {
        ...createCadastroCaoDto,
        fotoPerfil: 'placeholder.jpg',
        fotoLateral: 'placeholder.jpg',
      },
    );

    this.processMediaInBackground(
      cadastro.cadastroId,
      fotoPerfil,
      fotoLateral,
      pedigreeFrente,
      pedigreeVerso,
      video,
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
      throw new NotFoundException('Cadastro de cão não encontrado');
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
      throw new NotFoundException('Cadastro de cão não encontrado');
    }

    if (existingCadastro.userId !== userId) {
      throw new ForbiddenException(
        'Você não tem permissão para editar este cadastro',
      );
    }

    this.validateConditionalData(updateCadastroCaoDto);

    const cadastro = await this.cadastroCaoRepository.update(
      cadastroId,
      updateCadastroCaoDto,
    );
    return this.mapToResponseDto(cadastro);
  }

  async remove(cadastroId: string, userId: string): Promise<void> {
    const cadastro = await this.cadastroCaoRepository.findById(cadastroId);

    if (!cadastro) {
      throw new NotFoundException('Cadastro de cão não encontrado');
    }

    if (cadastro.userId !== userId) {
      throw new ForbiddenException(
        'Você não tem permissão para excluir este cadastro',
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
          'Registro do pedigree é obrigatório quando o cão tem pedigree',
        );
      }
    }

    if (data.temMicrochip === true) {
      if (!data.numeroMicrochip) {
        throw new BadRequestException(
          'Número do microchip é obrigatório quando o cão tem microchip',
        );
      }
    }

    if (data.videoOption) {
      if (
        data.videoOption === VideoOption.UPLOAD ||
        data.videoOption === VideoOption.URL
      ) {
        if (!data.videoUrl) {
          throw new BadRequestException(
            'URL do vídeo é obrigatória para a opção selecionada',
          );
        }
      }

      if (data.videoOption === VideoOption.WHATSAPP) {
        if (!data.whatsappContato) {
          throw new BadRequestException(
            'Contato do WhatsApp é obrigatório para a opção selecionada',
          );
        }
      }
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

  /**
   * Aprova um cadastro de cão
   */
  async aprovarCadastro(
    cadastroId: string,
    aprovadoPor: string,
  ): Promise<CadastroCaoResponseDto> {
    const cadastro = await this.cadastroCaoRepository.findById(cadastroId);
    if (!cadastro) {
      throw new NotFoundException('Cadastro de cão não encontrado');
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
      video
        ? this.fileUploadService.processUploadedFile(video, 'dogVideo')
        : Promise.resolve(undefined),
    ]);

    await this.cadastroCaoRepository.update(cadastroId, {
      fotoPerfil: fotoPerfilUrl?.url,
      fotoLateral: fotoLateralUrl?.url,
      pedigreeFrente: pedigreeFrenteUrl?.url,
      pedigreeVerso: pedigreeVersoUrl?.url,
      videoUrl: videoUrl?.url,
    });
  }

  /**
   * Rejeita um cadastro de cão
   */
  async rejeitarCadastro(
    cadastroId: string,
    motivoRejeicao: string,
    aprovadoPor: string,
  ): Promise<CadastroCaoResponseDto> {
    const cadastro = await this.cadastroCaoRepository.findById(cadastroId);
    if (!cadastro) {
      throw new NotFoundException('Cadastro de cão não encontrado');
    }

    if (cadastro.status !== 'PENDENTE') {
      throw new BadRequestException(
        'Apenas cadastros pendentes podem ser rejeitados',
      );
    }

    if (!motivoRejeicao || motivoRejeicao.trim() === '') {
      throw new BadRequestException('Motivo da rejeição é obrigatório');
    }

    const cadastroRejeitado = await this.cadastroCaoRepository.rejeitarCadastro(
      cadastroId,
      motivoRejeicao,
      aprovadoPor,
    );

    return this.mapToResponseDto(cadastroRejeitado);
  }

  /**
   * Conta cadastros pendentes de validação
   */
  async countPendentesValidacao(): Promise<number> {
    return this.cadastroCaoRepository.countPendentesValidacao();
  }

  /**
   * Lista cadastros pendentes de validação
   */
  async findPendentesValidacao(
    limit: number = 50,
  ): Promise<CadastroCaoResponseDto[]> {
    const cadastros =
      await this.cadastroCaoRepository.findPendentesValidacao(limit);
    return cadastros.map((cadastro) => this.mapToResponseDto(cadastro));
  }

  /**
   * Lista cadastros com raças pendentes de aprovação
   */
  async findPendentesRaca(
    limit: number = 50,
  ): Promise<CadastroCaoResponseDto[]> {
    const cadastros = await this.cadastroCaoRepository.findPendentesRaca(limit);
    return cadastros.map((cadastro) => this.mapToResponseDto(cadastro));
  }
}
