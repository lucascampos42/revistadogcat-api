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
    this.checkUserPermission(userId, requestingUser);
    this.validateEstado(createEnderecoDto.estado);
    await this.checkEnderecoLimit(userId);

    const enderecoCount = await this.enderecoRepository.countByUserId(userId);
    if (enderecoCount === 0) {
      createEnderecoDto.principal = true;
    } else if (createEnderecoDto.principal) {
      await this.enderecoRepository.clearPrincipal(userId);
    }

    return this.enderecoRepository.create(userId, createEnderecoDto);
  }

  async findByUserId(
    userId: string,
    filters: EnderecoFiltersDto,
    requestingUser: RequestingUser,
  ): Promise<{ enderecos: Endereco[]; total: number }> {
    this.checkUserPermission(userId, requestingUser);
    const [enderecos, total] = await Promise.all([
        this.enderecoRepository.findByUserId(userId, filters),
        this.enderecoRepository.countByUserId(userId, filters)
    ]);
    return { enderecos, total };
  }

  async findById(
    userId: string,
    enderecoId: string,
    requestingUser: RequestingUser,
  ): Promise<Endereco> {
    this.checkUserPermission(userId, requestingUser);
    const endereco = await this.enderecoRepository.findById(enderecoId, userId);
    if (!endereco) {
      throw new NotFoundException('Endereço não encontrado para este usuário');
    }
    return endereco;
  }

  async update(
    userId: string,
    enderecoId: string,
    updateEnderecoDto: UpdateEnderecoDto,
    requestingUser: RequestingUser,
  ): Promise<Endereco> {
    const endereco = await this.findById(userId, enderecoId, requestingUser);

    if (updateEnderecoDto.estado) {
      this.validateEstado(updateEnderecoDto.estado);
    }

    if (updateEnderecoDto.principal === true && !endereco.principal) {
      await this.enderecoRepository.clearPrincipal(userId);
    } else if (updateEnderecoDto.principal === false && endereco.principal) {
      throw new BadRequestException('Não é possível remover o status de principal. Defina outro endereço como principal.');
    }

    return this.enderecoRepository.update(enderecoId, userId, updateEnderecoDto);
  }

  async setPrincipal(
    userId: string,
    enderecoId: string,
    requestingUser: RequestingUser,
  ): Promise<Endereco> {
    const endereco = await this.findById(userId, enderecoId, requestingUser);

    if (!endereco.ativo) {
      throw new BadRequestException('Não é possível definir um endereço inativo como principal');
    }

    if (endereco.principal) {
        return endereco;
    }

    return this.enderecoRepository.setPrincipal(enderecoId, userId);
  }

  async deactivate(
    userId: string,
    enderecoId: string,
    requestingUser: RequestingUser,
  ): Promise<Endereco> {
    await this.findById(userId, enderecoId, requestingUser);
    const endereco = await this.findById(userId, enderecoId, requestingUser);

    if (endereco.principal) {
      throw new BadRequestException('Não é possível desativar o endereço principal. Defina outro como principal primeiro.');
    }

    return this.enderecoRepository.deactivate(enderecoId, userId);
  }

  async reactivate(
    userId: string,
    enderecoId: string,
    requestingUser: RequestingUser,
  ): Promise<Endereco> {
    await this.findById(userId, enderecoId, requestingUser);

    const activeCount = await this.enderecoRepository.countActiveByUserId(userId);
    if (activeCount >= this.MAX_ENDERECOS_POR_USUARIO) {
      throw new BadRequestException(`Limite máximo de ${this.MAX_ENDERECOS_POR_USUARIO} endereços ativos excedido`);
    }

    return this.enderecoRepository.reactivate(enderecoId, userId);
  }

  async delete(
    userId: string,
    enderecoId: string,
    requestingUser: RequestingUser,
  ): Promise<void> {
    const endereco = await this.findById(userId, enderecoId, requestingUser);

    if (endereco.principal) {
      throw new BadRequestException('Não é possível excluir o endereço principal. Defina outro endereço como principal primeiro.');
    }

    const totalCount = await this.enderecoRepository.countByUserId(userId);
    if (totalCount <= 1) {
        throw new BadRequestException('Não é possível excluir o último endereço do usuário.');
    }

    await this.enderecoRepository.delete(enderecoId, userId);
  }

  private checkUserPermission(targetUserId: string, requestingUser: RequestingUser): void {
    if (requestingUser.role !== Role.ADMIN && requestingUser.userId !== targetUserId) {
      throw new ForbiddenException('Você não tem permissão para acessar ou modificar endereços de outro usuário');
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
