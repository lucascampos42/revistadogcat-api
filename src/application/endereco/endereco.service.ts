import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { EnderecoRepository } from './repositories/endereco.repository';
import { CreateEnderecoDto, UpdateEnderecoDto, EnderecoFiltersDto } from './dto';
import { Endereco, Role } from '@prisma/client';

interface RequestingUser {
  userId: string;
  role: Role;
}

@Injectable()
export class EnderecoService {
  private readonly MAX_ENDERECOS_POR_USUARIO = 10;
  private readonly ESTADOS_VALIDOS = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  constructor(private readonly enderecoRepository: EnderecoRepository) {}

  async create(
    userId: string,
    createEnderecoDto: CreateEnderecoDto,
    requestingUser: RequestingUser,
  ): Promise<Endereco> {
    // Verificar permissões
    this.checkUserPermission(userId, requestingUser);

    // Validar estado
    this.validateEstado(createEnderecoDto.estado);

    // Verificar limite de endereços
    await this.checkEnderecoLimit(userId);

    // Se for o primeiro endereço, definir como principal automaticamente
    const enderecoCount = await this.enderecoRepository.countByUserId(userId);
    if (enderecoCount === 0) {
      createEnderecoDto.principal = true;
    }

    // Se definido como principal, remover principal dos outros
    if (createEnderecoDto.principal) {
      const endereco = await this.enderecoRepository.create(userId, createEnderecoDto);
      return this.enderecoRepository.setPrincipal(endereco.enderecoId, userId);
    }

    return this.enderecoRepository.create(userId, createEnderecoDto);
  }

  async findByUserId(
    userId: string,
    filters: EnderecoFiltersDto,
    requestingUser: RequestingUser,
  ): Promise<{ enderecos: Endereco[]; total: number }> {
    // Verificar permissões
    this.checkUserPermission(userId, requestingUser);

    const enderecos = await this.enderecoRepository.findByUserId(userId, filters);
    const total = enderecos.length;

    return { enderecos, total };
  }

  async findById(
    enderecoId: string,
    requestingUser: RequestingUser,
  ): Promise<Endereco> {
    const endereco = await this.enderecoRepository.findById(enderecoId);
    if (!endereco) {
      throw new NotFoundException('Endereço não encontrado');
    }

    // Verificar permissões
    this.checkUserPermission(endereco.userId, requestingUser);

    return endereco;
  }

  async update(
    enderecoId: string,
    updateEnderecoDto: UpdateEnderecoDto,
    requestingUser: RequestingUser,
  ): Promise<Endereco> {
    const endereco = await this.enderecoRepository.findById(enderecoId);
    if (!endereco) {
      throw new NotFoundException('Endereço não encontrado');
    }

    // Verificar permissões
    this.checkUserPermission(endereco.userId, requestingUser);

    // Validar estado se fornecido
    if (updateEnderecoDto.estado) {
      this.validateEstado(updateEnderecoDto.estado);
    }

    // Se definido como principal, remover principal dos outros
    if (updateEnderecoDto.principal) {
      await this.enderecoRepository.setPrincipal(enderecoId, endereco.userId);
      // Remover principal do DTO para evitar conflito na atualização
      delete updateEnderecoDto.principal;
    }

    return this.enderecoRepository.update(enderecoId, updateEnderecoDto);
  }

  async setPrincipal(
    enderecoId: string,
    requestingUser: RequestingUser,
  ): Promise<Endereco> {
    const endereco = await this.enderecoRepository.findById(enderecoId);
    if (!endereco) {
      throw new NotFoundException('Endereço não encontrado');
    }

    // Verificar permissões
    this.checkUserPermission(endereco.userId, requestingUser);

    // Verificar se o endereço está ativo
    if (!endereco.ativo) {
      throw new BadRequestException('Não é possível definir um endereço inativo como principal');
    }

    return this.enderecoRepository.setPrincipal(enderecoId, endereco.userId);
  }

  async deactivate(
    enderecoId: string,
    requestingUser: RequestingUser,
  ): Promise<Endereco> {
    const endereco = await this.enderecoRepository.findById(enderecoId);
    if (!endereco) {
      throw new NotFoundException('Endereço não encontrado');
    }

    // Verificar permissões
    this.checkUserPermission(endereco.userId, requestingUser);

    // Verificar se não é o último endereço ativo
    const activeCount = await this.enderecoRepository.countActiveByUserId(endereco.userId);
    if (activeCount <= 1) {
      throw new BadRequestException('Não é possível desativar o último endereço ativo do usuário');
    }

    // Se for o endereço principal, definir outro como principal
    if (endereco.principal) {
      const outrosEnderecos = await this.enderecoRepository.findByUserId(
        endereco.userId,
        { ativo: true }
      );
      const novoEnderecoPrincipal = outrosEnderecos.find(e => e.enderecoId !== enderecoId);
      if (novoEnderecoPrincipal) {
        await this.enderecoRepository.setPrincipal(novoEnderecoPrincipal.enderecoId, endereco.userId);
      }
    }

    return this.enderecoRepository.deactivate(enderecoId);
  }

  async reactivate(
    enderecoId: string,
    requestingUser: RequestingUser,
  ): Promise<Endereco> {
    const endereco = await this.enderecoRepository.findById(enderecoId);
    if (!endereco) {
      throw new NotFoundException('Endereço não encontrado');
    }

    // Verificar permissões
    this.checkUserPermission(endereco.userId, requestingUser);

    // Verificar limite de endereços ativos
    const activeCount = await this.enderecoRepository.countActiveByUserId(endereco.userId);
    if (activeCount >= this.MAX_ENDERECOS_POR_USUARIO) {
      throw new BadRequestException(`Limite máximo de ${this.MAX_ENDERECOS_POR_USUARIO} endereços ativos excedido`);
    }

    return this.enderecoRepository.reactivate(enderecoId);
  }

  async delete(
    enderecoId: string,
    requestingUser: RequestingUser,
  ): Promise<void> {
    const endereco = await this.enderecoRepository.findById(enderecoId);
    if (!endereco) {
      throw new NotFoundException('Endereço não encontrado');
    }

    // Verificar permissões
    this.checkUserPermission(endereco.userId, requestingUser);

    // Verificar se não é o endereço principal
    if (endereco.principal) {
      throw new BadRequestException('Não é possível excluir o endereço principal. Defina outro endereço como principal primeiro.');
    }

    // Verificar se não é o último endereço ativo
    const activeCount = await this.enderecoRepository.countActiveByUserId(endereco.userId);
    if (activeCount <= 1 && endereco.ativo) {
      throw new BadRequestException('Não é possível excluir o último endereço ativo do usuário');
    }

    await this.enderecoRepository.delete(enderecoId);
  }

  private checkUserPermission(targetUserId: string, requestingUser: RequestingUser): void {
    if (requestingUser.role !== Role.ADMIN && requestingUser.userId !== targetUserId) {
      throw new ForbiddenException('Você não tem permissão para acessar endereços de outro usuário');
    }
  }

  private validateEstado(estado: string): void {
    if (!this.ESTADOS_VALIDOS.includes(estado.toUpperCase())) {
      throw new BadRequestException(`Estado inválido. Estados válidos: ${this.ESTADOS_VALIDOS.join(', ')}`);
    }
  }

  private async checkEnderecoLimit(userId: string): Promise<void> {
    const count = await this.enderecoRepository.countByUserId(userId);
    if (count >= this.MAX_ENDERECOS_POR_USUARIO) {
      throw new BadRequestException(`Limite máximo de ${this.MAX_ENDERECOS_POR_USUARIO} endereços por usuário excedido`);
    }
  }
}