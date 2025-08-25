import { Endereco, TipoEndereco } from '@prisma/client';
import { CreateEnderecoDto, UpdateEnderecoDto } from '../dto';

export interface EnderecoFilters {
  ativo?: boolean;
  tipo?: TipoEndereco;
}

export interface IEnderecoRepository {
  create(userId: string, data: CreateEnderecoDto): Promise<Endereco>;
  findById(enderecoId: string): Promise<Endereco | null>;
  findByUserId(userId: string, filters?: EnderecoFilters): Promise<Endereco[]>;
  findPrincipalByUserId(userId: string): Promise<Endereco | null>;
  update(enderecoId: string, data: UpdateEnderecoDto): Promise<Endereco>;
  delete(enderecoId: string): Promise<void>;
  setPrincipal(enderecoId: string, userId: string): Promise<Endereco>;
  deactivate(enderecoId: string): Promise<Endereco>;
  reactivate(enderecoId: string): Promise<Endereco>;
  countActiveByUserId(userId: string): Promise<number>;
  countByUserId(userId: string): Promise<number>;
}