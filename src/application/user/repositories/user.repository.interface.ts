import { User, Role } from '@prisma/client';
import { CreateUserDto } from '../../auth/dto/create-auth.dto';

export interface IUserRepository {
  create(data: CreateUserDto): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByUsername(userName: string): Promise<User | null>;
  findByCpf(cpf: string): Promise<User | null>;
  findByIdentification(identification: string): Promise<User | null>;
  findForAuthByIdentification(identification: string): Promise<User | null>;
  findByPasswordResetToken(token: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  findAllPaged(params: {
    page: number;
    limit: number;
    role?: Role;
    search?: string;
    userName?: string;
    email?: string;
  }): Promise<{ data: User[]; total: number; page: number; limit: number }>;
  update(id: string, data: Partial<User>): Promise<User>;
  blockUser(id: string, blockedUntil?: Date): Promise<User>;
  unblockUser(id: string): Promise<User>;
  restoreUser(id: string): Promise<User>;
  remove(id: string): Promise<User>;
  checkUserExists(data: {
    userName?: string;
    email?: string;
    cpf?: string;
  }): Promise<{
    userNameExists: boolean;
    emailExists: boolean;
    cpfExists: boolean;
  }>;
}
