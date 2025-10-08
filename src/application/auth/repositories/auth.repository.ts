import { Injectable, Logger } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../../../core/config/prisma.service';
import { IAuthRepository } from './auth.repository.interface';
import { Prisma } from '@prisma/client';

@Injectable()
export class AuthRepository implements IAuthRepository {
  private readonly logger = new Logger(AuthRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async createUser(userData: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({
      data: userData,
    });
  }

  async findUserByPasswordResetToken(token: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: { gte: new Date() },
      },
    });
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async updateUserTokens(
    userId: string,
    data: {
      refreshToken?: string | null;
      refreshTokenExpiresAt?: Date | null;
      tokenVersion?: number;
      passwordResetToken?: string | null;
      passwordResetExpires?: Date | null;
    },
  ): Promise<User> {
    return this.prisma.user.update({
      where: { userId },
      data,
    });
  }

  async updateUserPassword(
    userId: string,
    hashedPassword: string,
  ): Promise<User> {
    return this.prisma.user.update({
      where: { userId },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
        tokenVersion: { increment: 1 },
        refreshToken: null,
      },
    });
  }

  async incrementTokenVersion(userId: string): Promise<User | null> {
    try {
      return await this.prisma.user.update({
        where: { userId },
        data: {
          tokenVersion: { increment: 1 },
          refreshToken: null, // Invalida o refresh token ao fazer logout
        },
      });
    } catch (error) {
      // Se o erro for "Record to update not found", o usuário já foi deletado.
      // Isso não é um erro no contexto do logout, então retornamos null.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        this.logger.warn(
          `Tentativa de logout para usuário não existente: ${userId}`,
        );
        return null;
      }
      // Para todos os outros erros, nós os lançamos para serem tratados pelo filtro global.
      throw error;
    }
  }
}
