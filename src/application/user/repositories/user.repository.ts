import { Injectable } from '@nestjs/common';
import { User, Role } from '@prisma/client';
import { PrismaService } from '../../../core/config/prisma.service';
import { CreateUserDto } from '../../auth/dto/create-auth.dto';
import { IUserRepository } from './user.repository.interface';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  private readonly _include = {
    enderecos: true,
  };

  async create(data: CreateUserDto): Promise<User> {
    return this.prisma.user.create({
      data: {
        ...data,
        cpf: data.cpf ?? null,
        telefone: data.telefone ?? null,
        avatarUrl: data.avatarUrl ?? null,
        role: data.role ?? Role.USUARIO,
        active: data.active ?? false,
      },
      include: this._include,
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { userId: id },
      include: this._include,
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: this._include,
    });
  }

  async findByUsername(userName: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { userName },
      include: this._include,
    });
  }

  async findByCpf(cpf: string): Promise<User | null> {
    if (!cpf) return null;
    return this.prisma.user.findUnique({
      where: { cpf },
      include: this._include,
    });
  }

  async findByIdentification(identification: string): Promise<User | null> {
    const user = await this.findForAuthByIdentification(identification);
    if (user) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      return result as User;
    }
    return null;
  }

  async findForAuthByIdentification(identification: string): Promise<User | null> {
    const isEmail = identification.includes('@');
    const isCpf = /^\d{11}$/.test(identification.replace(/\D/g, ''));

    if (isEmail) {
      return this.prisma.user.findUnique({ where: { email: identification } });
    }

    if (isCpf) {
      return this.prisma.user.findUnique({ where: { cpf: identification.replace(/\D/g, '') } });
    }

    return this.prisma.user.findFirst({ where: { userName: identification } });
  }

  async findByPasswordResetToken(token: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { passwordResetToken: token },
      include: this._include,
    });
  }

  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany({ include: this._include });
  }

  async findAllPaged(params: {
    page: number;
    limit: number;
    role?: Role;
    search?: string;
    userName?: string;
    email?: string;
  }): Promise<{
    data: User[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page, limit, role, search, userName, email } = params;
    const skip = (page - 1) * limit;
    const where: any = {};

    if (role) where.role = role;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { userName: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (userName) where.userName = { contains: userName, mode: 'insensitive' };
    if (email) where.email = { contains: email, mode: 'insensitive' };

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: this._include,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    return this.prisma.user.update({
      where: { userId: id },
      data,
      include: this._include,
    });
  }

  async blockUser(id: string, blockedUntil?: Date): Promise<User> {
    return this.prisma.user.update({
      where: { userId: id },
      data: {
        blocked: true,
        blockedUntil: blockedUntil || new Date(Date.now() + 15 * 60 * 1000),
      },
      include: this._include,
    });
  }

  async unblockUser(id: string): Promise<User> {
    return this.prisma.user.update({
      where: { userId: id },
      data: {
        blocked: false,
        blockedUntil: null,
        loginAttempts: 0,
      },
      include: this._include,
    });
  }

  async restoreUser(id: string): Promise<User> {
    return this.prisma.user.update({
      where: { userId: id },
      data: {
        deletedAt: null,
        active: true,
        blocked: false,
        blockedUntil: null,
      },
      include: this._include,
    });
  }

  async remove(id: string): Promise<User> {
    return this.prisma.user.update({
      where: { userId: id },
      data: {
        deletedAt: new Date(),
        active: false,
      },
      include: this._include,
    });
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
    const [userNameExists, emailExists, cpfExists] = await Promise.all([
      data.userName
        ? this.prisma.user.findFirst({ where: { userName: data.userName } })
        : null,
      data.email
        ? this.prisma.user.findUnique({ where: { email: data.email } })
        : null,
      data.cpf
        ? this.prisma.user.findUnique({ where: { cpf: data.cpf } })
        : null,
    ]);

    return {
      userNameExists: !!userNameExists,
      emailExists: !!emailExists,
      cpfExists: !!cpfExists,
    };
  }
}
