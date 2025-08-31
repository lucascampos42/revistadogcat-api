import { Injectable, Inject, ForbiddenException, NotFoundException } from '@nestjs/common';
import { User, Role } from '@prisma/client';
import { IUserRepository } from './repositories/user.repository.interface';
import { PublicUserDto } from './dto/public-user.dto';
import { UpdateUserDto } from '../auth/dto/update-auth.dto';

interface RequestingUser {
  userId: string;
  role: Role;
}

@Injectable()
export class UserService {
  constructor(
    @Inject('IUserRepository') private readonly userRepository: IUserRepository,
  ) {}

  private mapToPublicDto(user: User): PublicUserDto {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, cpf, refreshToken, tokenVersion, passwordResetToken, passwordResetExpires, activationToken, activationTokenExpires, ...publicData } = user;
    return publicData;
  }

  // --- Métodos Públicos (retornam DTO) ---

  async findOneById(id: string, requestingUser: RequestingUser): Promise<PublicUserDto> {
    if (requestingUser.role !== Role.ADMIN && requestingUser.userId !== id) {
      throw new ForbiddenException('Você só pode visualizar seu próprio perfil');
    }
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    return this.mapToPublicDto(user);
  }

  async findAllPaged(params: { page: number; limit: number; role?: Role; search?: string; }) {
    const result = await this.userRepository.findAllPaged(params);
    return {
      ...result,
      data: result.data.map(this.mapToPublicDto),
    };
  }

  async update(id: string, data: Partial<UpdateUserDto>, requestingUser: RequestingUser): Promise<PublicUserDto> {
    if (requestingUser.role !== Role.ADMIN && requestingUser.userId !== id) {
      throw new ForbiddenException('Você só pode editar seus próprios dados');
    }
    if (data.role && requestingUser.role !== Role.ADMIN) {
      throw new ForbiddenException('Você não tem permissão para alterar seu próprio role');
    }
    const updatedUser = await this.userRepository.update(id, data);
    return this.mapToPublicDto(updatedUser);
  }

  async remove(id: string): Promise<PublicUserDto> {
    const user = await this.userRepository.remove(id);
    return this.mapToPublicDto(user);
  }

  async blockUser(id: string, blockedUntil?: Date): Promise<PublicUserDto> {
    const user = await this.userRepository.blockUser(id, blockedUntil);
    return this.mapToPublicDto(user);
  }

  async unblockUser(id: string): Promise<PublicUserDto> {
    const user = await this.userRepository.unblockUser(id);
    return this.mapToPublicDto(user);
  }

  async restoreUser(id: string): Promise<PublicUserDto> {
    const user = await this.userRepository.restoreUser(id);
    return this.mapToPublicDto(user);
  }

  async updateUserRole(id: string, role: Role): Promise<PublicUserDto> {
    const user = await this.userRepository.update(id, { role });
    return this.mapToPublicDto(user);
  }

  async uploadAvatar(id: string, avatarUrl: string): Promise<PublicUserDto> {
    const user = await this.userRepository.update(id, { avatarUrl });
    return this.mapToPublicDto(user);
  }

  // --- Métodos Internos (para uso de outros serviços como Auth) ---

  async findUserEntityById(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  async findUserEntityByIdentification(identification: string): Promise<User | null> {
    return this.userRepository.findByIdentification(identification);
  }

  async checkUserExists(data: { userName?: string; email?: string; cpf?: string; }) {
    return this.userRepository.checkUserExists(data);
  }

  async systemUpdate(id: string, data: Partial<User>): Promise<User> {
    return this.userRepository.update(id, data);
  }
}
