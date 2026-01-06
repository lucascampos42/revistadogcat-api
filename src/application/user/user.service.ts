import {
  Injectable,
  Inject,
  ForbiddenException,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { User, Role, Endereco } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { IUserRepository } from './repositories/user.repository.interface';
import { PublicUserDto } from './dto/public-user.dto';
import { UpdateUserDto } from '../auth/dto/update-auth.dto';
import { FullUserDto } from './dto/full-user.dto';
import { AddressDto } from './dto/address.dto';

interface RequestingUser {
  userId: string;
  role: Role;
}

@Injectable()
export class UserService {
  constructor(
    @Inject('IUserRepository') private readonly userRepository: IUserRepository,
  ) {}

  private mapToPublicDto(
    user: User & { enderecos?: Endereco[] },
  ): PublicUserDto {
    const principalEndereco = user.enderecos?.find((e) => e.principal);

    return {
      userId: user.userId,
      userName: user.userName,
      name: user.name,
      email: user.email,
      cpf: user.cpf,
      avatarUrl: user.avatarUrl,
      role: user.role,
      active: user.active,
      blocked: user.blocked,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLogin: user.lastLogin,
      endereco: {
        logradouro: principalEndereco?.logradouro ?? '',
        numero: principalEndereco?.numero ?? '',
        complemento: principalEndereco?.complemento ?? '',
        bairro: principalEndereco?.bairro ?? '',
        cidade: principalEndereco?.cidade ?? '',
        estado: principalEndereco?.estado ?? '',
        cep: principalEndereco?.cep ?? '',
      },
    };
  }

  private mapToFullDto(user: User & { enderecos?: Endereco[] }): FullUserDto {
    const principalEndereco = user.enderecos?.find((e) => e.principal);

    return {
      userId: user.userId,
      userName: user.userName,
      name: user.name,
      email: user.email,
      cpf: user.cpf,
      telefone: user.telefone,
      avatarUrl: user.avatarUrl,
      role: user.role,
      active: user.active,
      blocked: user.blocked,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLogin: user.lastLogin,
      endereco: {
        logradouro: principalEndereco?.logradouro ?? '',
        numero: principalEndereco?.numero ?? '',
        complemento: principalEndereco?.complemento ?? '',
        bairro: principalEndereco?.bairro ?? '',
        cidade: principalEndereco?.cidade ?? '',
        estado: principalEndereco?.estado ?? '',
        cep: principalEndereco?.cep ?? '',
      },
      enderecos: (user.enderecos ?? []).map(
        (e): AddressDto => ({
          logradouro: e.logradouro,
          numero: e.numero,
          complemento: e.complemento,
          bairro: e.bairro,
          cidade: e.cidade,
          estado: e.estado,
          cep: e.cep,
        }),
      ),
    };
  }

  private async findUserOrFail(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    return user;
  }

  async findMe(requestingUser: RequestingUser): Promise<FullUserDto> {
    const user = await this.findUserOrFail(requestingUser.userId);
    return this.mapToFullDto(user);
  }

  private async generateUniqueUserName(email: string): Promise<string> {
    if (!email || !email.includes('@')) {
      throw new InternalServerErrorException(
        'Email inválido para gerar nome de usuário.',
      );
    }
    const baseUserName = email
      .split('@')[0]
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '');
    let finalUserName = baseUserName;
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      const { userNameExists } = await this.userRepository.checkUserExists({
        userName: finalUserName,
      });
      if (!userNameExists) {
        isUnique = true;
      } else {
        finalUserName = `${baseUserName}${Math.floor(100 + Math.random() * 900)}`;
        attempts++;
      }
    }

    if (!isUnique) {
      throw new InternalServerErrorException(
        'Não foi possível gerar um nome de usuário único.',
      );
    }

    return finalUserName;
  }

  async registerThirdParty(data: {
    nome: string;
    email: string;
    cpf: string;
    telefone: string;
  }): Promise<{ userId: string }> {
    const { nome, email, cpf, telefone } = data;

    const existingUser = await this.userRepository.checkUserExists({
      email,
      cpf,
    });
    if (existingUser.emailExists) {
      throw new ConflictException(`O email '${email}' já está em uso.`);
    }
    if (existingUser.cpfExists) {
      throw new ConflictException(`O CPF '${cpf}' já está em uso.`);
    }

    const userName = await this.generateUniqueUserName(email);
    const randomPassword = crypto.randomBytes(16).toString('hex');
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    const newUser = await this.userRepository.create({
      name: nome,
      userName,
      email,
      cpf,
      telefone,
      password: hashedPassword,
      role: Role.USUARIO,
      active: true,
    });

    return { userId: newUser.userId };
  }

  async findOneById(
    id: string,
    requestingUser: RequestingUser,
  ): Promise<PublicUserDto> {
    const user = await this.findUserOrFail(id);
    if (requestingUser.role !== Role.ADMIN && requestingUser.userId !== id) {
      throw new ForbiddenException(
        'Você só pode visualizar seu próprio perfil',
      );
    }
    return this.mapToPublicDto(user);
  }

  async findAllPaged(params: {
    page: number;
    limit: number;
    role?: Role;
    search?: string;
  }) {
    const result = await this.userRepository.findAllPaged(params);
    return {
      ...result,
      data: result.data.map(this.mapToPublicDto),
    };
  }

  async update(
    id: string,
    data: Partial<UpdateUserDto>,
    requestingUser: RequestingUser,
  ): Promise<PublicUserDto> {
    await this.findUserOrFail(id);
    if (requestingUser.role !== Role.ADMIN && requestingUser.userId !== id) {
      throw new ForbiddenException('Você só pode editar seus próprios dados');
    }
    if (data.role && requestingUser.role !== Role.ADMIN) {
      throw new ForbiddenException(
        'Você não tem permissão para alterar seu próprio role',
      );
    }
    // Se senha foi fornecida (não vazia), fazer hash antes de atualizar
    if (typeof data.password === 'string') {
      const trimmed = data.password.trim();
      if (trimmed.length === 0) {
        delete (data as any).password; // evita tentar validar/atualizar senha vazia
      } else {
        const hashed = await bcrypt.hash(trimmed, 10);
        (data as any).password = hashed;
        // Opcional: invalidar refresh tokens (incrementar tokenVersion) em troca de segurança
        // Poderíamos mover para AuthRepository se necessário
      }
    }
    const updatedUser = await this.userRepository.update(id, data as any);
    return this.mapToPublicDto(updatedUser);
  }

  async remove(id: string): Promise<PublicUserDto> {
    const user = await this.findUserOrFail(id);
    const removedUser = await this.userRepository.remove(user.userId);
    return this.mapToPublicDto(removedUser);
  }

  async blockUser(id: string, blockedUntil?: Date): Promise<PublicUserDto> {
    await this.findUserOrFail(id);
    const user = await this.userRepository.blockUser(id, blockedUntil);
    return this.mapToPublicDto(user);
  }

  async unblockUser(id: string): Promise<PublicUserDto> {
    await this.findUserOrFail(id);
    const user = await this.userRepository.unblockUser(id);
    return this.mapToPublicDto(user);
  }

  async restoreUser(id: string): Promise<PublicUserDto> {
    await this.findUserOrFail(id);
    const user = await this.userRepository.restoreUser(id);
    return this.mapToPublicDto(user);
  }

  async updateUserRole(id: string, role: Role): Promise<PublicUserDto> {
    await this.findUserOrFail(id);
    const user = await this.userRepository.update(id, { role });
    return this.mapToPublicDto(user);
  }

  async uploadAvatar(id: string, avatarUrl: string): Promise<PublicUserDto> {
    await this.findUserOrFail(id);
    const user = await this.userRepository.update(id, { avatarUrl });
    return this.mapToPublicDto(user);
  }

  async changePassword(id: string, password: string): Promise<PublicUserDto> {
    await this.findUserOrFail(id);
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.userRepository.update(id, {
      password: hashedPassword,
      // Invalidar tokens setando versão nova se existir tal lógica, mas por enquanto só atualiza senha
    });
    return this.mapToPublicDto(user);
  }

  // --- Métodos Internos (para uso de outros serviços como Auth) ---

  async findUserEntityById(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  async findUserForAuth(identification: string): Promise<User | null> {
    return this.userRepository.findForAuthByIdentification(identification);
  }

  async checkUserExists(data: {
    userName?: string;
    email?: string;
    cpf?: string;
  }) {
    return this.userRepository.checkUserExists(data);
  }

  async systemUpdate(id: string, data: Partial<User>): Promise<User> {
    return this.userRepository.update(id, data);
  }
  // Método simples para criação de usuário via serviço (utilizado por testes e cenários administrativos)
  async create(
    data: import('../auth/dto/create-auth.dto').CreateUserDto,
  ): Promise<User> {
    return this.userRepository.create(data);
  }
}
