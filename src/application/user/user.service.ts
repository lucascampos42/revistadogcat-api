import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
import { CreateUserDto } from '../auth/dto/create-auth.dto';
import { User, Role } from '@prisma/client';
import { IUserRepository } from './repositories/user.repository.interface';

interface RequestingUser {
  userId: string;
  role: Role;
}

/**
 * Service responsável pela lógica de negócio relacionada aos usuários
 * Utiliza o padrão Repository para separar a lógica de negócio do acesso a dados
 */
@Injectable()
export class UserService {
  constructor(
    @Inject('IUserRepository') private readonly userRepository: IUserRepository,
  ) {}

  async createUser(data: CreateUserDto): Promise<User> {
    return this.userRepository.create(data);
  }

  async findOneByUsername(userName: string): Promise<User | null> {
    return this.userRepository.findByUsername(userName);
  }

  async findOneByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  async findOneByCpf(cpf: string): Promise<User | null> {
    return this.userRepository.findByCpf(cpf);
  }

  async findByIdentification(identification: string): Promise<User | null> {
    return this.userRepository.findByIdentification(identification);
  }

  async checkUserExists(data: {
    userName?: string;
    email?: string;
    cpf?: string;
  }): Promise<{
    userNameExists: boolean;
    emailExists: boolean;
    cpfExists: boolean;
  }> {
    return this.userRepository.checkUserExists(data);
  }

  async findOneByPasswordResetToken(token: string): Promise<User | null> {
    return this.userRepository.findByPasswordResetToken(token);
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.findAll();
  }

  async findAllPaged(params: {
    page: number;
    limit: number;
    role?: Role;
    search?: string;
    userName?: string;
    email?: string;
  }): Promise<{ data: User[]; total: number; page: number; limit: number }> {
    return this.userRepository.findAllPaged(params);
  }

  async findOneById(id: string, requestingUser?: RequestingUser): Promise<User | null> {
    // Se não há usuário requisitante, comportamento original (para compatibilidade)
    if (!requestingUser) {
      return this.userRepository.findById(id);
    }

    // ADMIN pode ver qualquer usuário
    if (requestingUser.role === Role.ADMIN) {
      return this.userRepository.findById(id);
    }

    // Usuários só podem ver seu próprio perfil
    if (requestingUser.userId !== id) {
      throw new ForbiddenException('Você só pode visualizar seu próprio perfil');
    }

    return this.userRepository.findById(id);
  }

  async update(id: string, data: Partial<User>, requestingUser?: RequestingUser): Promise<User> {
    // Se não há usuário requisitante, comportamento original (para compatibilidade)
    if (!requestingUser) {
      return this.userRepository.update(id, data);
    }

    // ADMIN pode editar qualquer usuário
    if (requestingUser.role === Role.ADMIN) {
      return this.userRepository.update(id, data);
    }

    // Usuários só podem editar seus próprios dados
    if (requestingUser.userId !== id) {
      throw new ForbiddenException('Você só pode editar seus próprios dados');
    }

    // Usuários não-ADMIN não podem alterar o próprio role
    if (data.role && (requestingUser.role as Role) !== Role.ADMIN) {
      throw new ForbiddenException('Você não tem permissão para alterar seu próprio role');
    }

    return this.userRepository.update(id, data);
  }

  async remove(id: string): Promise<User> {
    return this.userRepository.remove(id);
  }

  async blockUser(id: string, blockedUntil?: Date): Promise<User> {
    return this.userRepository.blockUser(id, blockedUntil);
  }

  async unblockUser(id: string): Promise<User> {
    return this.userRepository.unblockUser(id);
  }

  async restoreUser(id: string): Promise<User> {
    return this.userRepository.restoreUser(id);
  }

  /**
   * Atualiza o role de um usuário
   * Apenas usuários com role ADMIN podem executar esta operação
   */
  async updateUserRole(id: string, role: Role): Promise<User> {
    return this.userRepository.update(id, { role });
  }

  /**
   * Atualiza o avatar do usuário
   */
  async uploadAvatar(id: string, avatarUrl: string): Promise<User> {
    return this.userRepository.update(id, { avatarUrl });
  }
}
