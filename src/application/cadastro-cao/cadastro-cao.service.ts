import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { CadastroCaoRepository } from './repositories/cadastro-cao.repository';
import { CreateCadastroCaoDto } from './dto/create-cadastro-cao.dto';
import { UpdateCadastroCaoDto } from './dto/update-cadastro-cao.dto';
import { ListCadastrosCaoDto, CadastrosCaoListResponseDto } from './dto/list-cadastros-cao.dto';
import { CadastroCaoResponseDto } from './dto/cadastro-cao-response.dto';
import { CadastroCaoEntity } from './entities/cadastro-cao.entity';
import { VideoOption } from '@prisma/client';

@Injectable()
export class CadastroCaoService {
  constructor(private readonly cadastroCaoRepository: CadastroCaoRepository) {}

  async create(userId: string, createCadastroCaoDto: CreateCadastroCaoDto): Promise<CadastroCaoResponseDto> {
    // Validar data de nascimento
    const dataNascimento = new Date(createCadastroCaoDto.dataNascimento);
    if (isNaN(dataNascimento.getTime())) {
      throw new BadRequestException('Data de nascimento inválida');
    }

    // Validar se a data não é no futuro
    if (dataNascimento > new Date()) {
      throw new BadRequestException('Data de nascimento não pode ser no futuro');
    }

    // Validar se o cão não é muito velho (mais de 25 anos)
    const hoje = new Date();
    const idade = hoje.getFullYear() - dataNascimento.getFullYear();
    if (idade > 25) {
      throw new BadRequestException('Data de nascimento muito antiga. Verifique se está correta.');
    }

    // Validar dados condicionais
    this.validateConditionalData(createCadastroCaoDto);

    const cadastro = await this.cadastroCaoRepository.create(userId, createCadastroCaoDto);
    return this.mapToResponseDto(cadastro);
  }

  async findAll(listCadastrosCaoDto: ListCadastrosCaoDto): Promise<CadastrosCaoListResponseDto> {
    const { data, total } = await this.cadastroCaoRepository.findAll(listCadastrosCaoDto);
    
    const page = parseInt(listCadastrosCaoDto.page || '1');
    const limit = Math.min(parseInt(listCadastrosCaoDto.limit || '10'), 50);
    const totalPages = Math.ceil(total / limit);

    return {
      data: data.map(cadastro => this.mapToResponseDto(cadastro)),
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
    return cadastros.map(cadastro => this.mapToResponseDto(cadastro));
  }

  async update(
    cadastroId: string, 
    userId: string, 
    updateCadastroCaoDto: UpdateCadastroCaoDto
  ): Promise<CadastroCaoResponseDto> {
    const existingCadastro = await this.cadastroCaoRepository.findById(cadastroId);
    
    if (!existingCadastro) {
      throw new NotFoundException('Cadastro de cão não encontrado');
    }

    // Verificar se o usuário é o dono do cadastro
    if (existingCadastro.userId !== userId) {
      throw new ForbiddenException('Você não tem permissão para editar este cadastro');
    }

    // Validar data de nascimento se fornecida
    if (updateCadastroCaoDto.dataNascimento) {
      const dataNascimento = new Date(updateCadastroCaoDto.dataNascimento);
      if (isNaN(dataNascimento.getTime())) {
        throw new BadRequestException('Data de nascimento inválida');
      }

      if (dataNascimento > new Date()) {
        throw new BadRequestException('Data de nascimento não pode ser no futuro');
      }

      const hoje = new Date();
      const idade = hoje.getFullYear() - dataNascimento.getFullYear();
      if (idade > 25) {
        throw new BadRequestException('Data de nascimento muito antiga. Verifique se está correta.');
      }
    }

    // Validar dados condicionais se fornecidos
    this.validateConditionalData(updateCadastroCaoDto);

    const cadastro = await this.cadastroCaoRepository.update(cadastroId, updateCadastroCaoDto);
    return this.mapToResponseDto(cadastro);
  }

  async remove(cadastroId: string, userId: string): Promise<void> {
    const cadastro = await this.cadastroCaoRepository.findById(cadastroId);
    
    if (!cadastro) {
      throw new NotFoundException('Cadastro de cão não encontrado');
    }

    // Verificar se o usuário é o dono do cadastro
    if (cadastro.userId !== userId) {
      throw new ForbiddenException('Você não tem permissão para excluir este cadastro');
    }

    await this.cadastroCaoRepository.delete(cadastroId);
  }

  async findByRaca(raca: string, limit: number = 10): Promise<CadastroCaoResponseDto[]> {
    const cadastros = await this.cadastroCaoRepository.findByRaca(raca, limit);
    return cadastros.map(cadastro => this.mapToResponseDto(cadastro));
  }

  async findBySexo(sexo: string, limit: number = 10): Promise<CadastroCaoResponseDto[]> {
    const cadastros = await this.cadastroCaoRepository.findBySexo(sexo, limit);
    return cadastros.map(cadastro => this.mapToResponseDto(cadastro));
  }

  async findComPedigree(): Promise<CadastroCaoResponseDto[]> {
    const cadastros = await this.cadastroCaoRepository.findComPedigree();
    return cadastros.map(cadastro => this.mapToResponseDto(cadastro));
  }

  async findComMicrochip(): Promise<CadastroCaoResponseDto[]> {
    const cadastros = await this.cadastroCaoRepository.findComMicrochip();
    return cadastros.map(cadastro => this.mapToResponseDto(cadastro));
  }

  async findComVideo(): Promise<CadastroCaoResponseDto[]> {
    const cadastros = await this.cadastroCaoRepository.findComVideo();
    return cadastros.map(cadastro => this.mapToResponseDto(cadastro));
  }

  async findRecentCadastros(limit: number = 5): Promise<CadastroCaoResponseDto[]> {
    const cadastros = await this.cadastroCaoRepository.findRecentCadastros(limit);
    return cadastros.map(cadastro => this.mapToResponseDto(cadastro));
  }

  async getUserCadastrosCount(userId: string): Promise<number> {
    return this.cadastroCaoRepository.countByUserId(userId);
  }

  private validateConditionalData(data: CreateCadastroCaoDto | UpdateCadastroCaoDto): void {
    // Validar dados do proprietário se proprietarioDiferente = true
    if (data.proprietarioDiferente === true) {
      if (!data.nomeProprietario) {
        throw new BadRequestException('Nome do proprietário é obrigatório quando proprietário é diferente');
      }
      if (!data.cpfProprietario) {
        throw new BadRequestException('CPF do proprietário é obrigatório quando proprietário é diferente');
      }
      if (!data.emailProprietario) {
        throw new BadRequestException('Email do proprietário é obrigatório quando proprietário é diferente');
      }
      if (!data.telefoneProprietario) {
        throw new BadRequestException('Telefone do proprietário é obrigatório quando proprietário é diferente');
      }
      if (!data.enderecoProprietario) {
        throw new BadRequestException('Endereço do proprietário é obrigatório quando proprietário é diferente');
      }
      if (!data.cidade) {
        throw new BadRequestException('Cidade é obrigatória quando proprietário é diferente');
      }
      if (!data.estado) {
        throw new BadRequestException('Estado é obrigatório quando proprietário é diferente');
      }
    }

    // Validar dados do pedigree se temPedigree = true
    if (data.temPedigree === true) {
      if (!data.registroPedigree) {
        throw new BadRequestException('Registro do pedigree é obrigatório quando o cão tem pedigree');
      }
      if (!data.pedigreeFrente) {
        throw new BadRequestException('Arquivo do pedigree (frente) é obrigatório quando o cão tem pedigree');
      }
      if (!data.pedigreeVerso) {
        throw new BadRequestException('Arquivo do pedigree (verso) é obrigatório quando o cão tem pedigree');
      }
    }

    // Validar dados do microchip se temMicrochip = true
    if (data.temMicrochip === true) {
      if (!data.numeroMicrochip) {
        throw new BadRequestException('Número do microchip é obrigatório quando o cão tem microchip');
      }
    }

    // Validar dados do vídeo conforme a opção escolhida
    if (data.videoOption) {
      if (data.videoOption === VideoOption.UPLOAD || data.videoOption === VideoOption.URL) {
        if (!data.videoUrl) {
          throw new BadRequestException('URL do vídeo é obrigatória para a opção selecionada');
        }
      }
      
      if (data.videoOption === VideoOption.WHATSAPP) {
        if (!data.whatsappContato) {
          throw new BadRequestException('Contato do WhatsApp é obrigatório para a opção selecionada');
        }
      }
    }
  }

  private mapToResponseDto(cadastro: CadastroCaoEntity): CadastroCaoResponseDto {
    return {
      cadastroId: cadastro.cadastroId,
      userId: cadastro.userId,
      proprietarioDiferente: cadastro.proprietarioDiferente,
      nomeProprietario: cadastro.nomeProprietario || undefined,
      cpfProprietario: cadastro.cpfProprietario || undefined,
      emailProprietario: cadastro.emailProprietario || undefined,
      telefoneProprietario: cadastro.telefoneProprietario || undefined,
      enderecoProprietario: cadastro.enderecoProprietario || undefined,
      cidade: cadastro.cidade || undefined,
      estado: cadastro.estado || undefined,
      nome: cadastro.nome,
      raca: cadastro.raca,
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
    };
  }
}