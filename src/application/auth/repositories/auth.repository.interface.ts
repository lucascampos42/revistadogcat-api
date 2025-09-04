import { User } from '@prisma/client';

export const AUTH_REPOSITORY_TOKEN = 'AUTH_REPOSITORY_TOKEN';

export interface IAuthRepository {
  createUser(userData: Omit<User, 'userId' | 'createdAt' | 'updatedAt'>): Promise<User>;
  findUserByPasswordResetToken(token: string): Promise<User | null>;
  findUserByEmail(email: string): Promise<User | null>;
  updateUserTokens(
    userId: string,
    data: {
      refreshToken?: string | null;
      refreshTokenExpiresAt?: Date | null;
      tokenVersion?: number;
      passwordResetToken?: string | null;
      passwordResetExpires?: Date | null;
    },
  ): Promise<User>;
  updateUserPassword(userId: string, hashedPassword: string): Promise<User>;
  incrementTokenVersion(userId: string): Promise<User | null>;
}
