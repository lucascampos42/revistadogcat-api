import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../src/application/user/user.service';
import { PrismaService } from '../src/core/config/prisma.service';
import { CreateUserDto } from '../src/application/auth/dto/create-auth.dto';
import { User, Role } from '@prisma/client';

const mockUserRepository = {
  create: jest.fn(),
  findAll: jest.fn(),
  findAllPaged: jest.fn(),
  findById: jest.fn(),
  findByEmail: jest.fn(),
  findByUsername: jest.fn(),
  findByCpf: jest.fn(),
  findByIdentification: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

const mockPrismaService = {
  user: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
};

describe('UserService', () => {
  let service: UserService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: 'IUserRepository',
          useValue: mockUserRepository,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user with correct data', async () => {
      const createUserDto: CreateUserDto = {
        userName: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      const expectedUser: User = {
        userId: '1',
        userName: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        cpf: null,
        telefone: null,
        avatarUrl: null,
        role: Role.USUARIO,
        active: false,
        lastLogin: null,
        tokenVersion: 1,
        refreshToken: null,
        refreshTokenExpiresAt: null,
        passwordResetToken: null,
        passwordResetExpires: null,
        blocked: false,
        blockedUntil: null,
        loginAttempts: 0,
        lastFailedLogin: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        votosDisponiveisComum: 0,
        votosUtilizadosComum: 0,
        votosDisponiveisSuper: 0,
        votosUtilizadosSuper: 0,
      };

      mockUserRepository.create.mockResolvedValue(expectedUser);

      const result = await service.create(createUserDto);

      expect(mockUserRepository.create).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(expectedUser);
    });
  });

  describe('findAllPaged', () => {
    it('should return an array of users', async () => {
      const users: User[] = [
        {
          userId: '1',
          userName: 'user1',
          name: 'User One',
          email: 'user1@example.com',
          password: 'p1',
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          role: Role.USUARIO,
          lastLogin: null,
          tokenVersion: 1,
          refreshToken: null,
          refreshTokenExpiresAt: null,
          passwordResetToken: null,
          passwordResetExpires: null,
          blocked: false,
          blockedUntil: null,
          loginAttempts: 0,
          lastFailedLogin: null,
          cpf: null,
          telefone: null,
          avatarUrl: null,
          votosDisponiveisComum: 0,
          votosUtilizadosComum: 0,
          votosDisponiveisSuper: 0,
          votosUtilizadosSuper: 0,
        },
        {
          userId: '2',
          userName: 'user2',
          name: 'User Two',
          email: 'user2@example.com',
          password: 'p2',
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          role: Role.USUARIO,
          lastLogin: null,
          tokenVersion: 1,
          refreshToken: null,
          refreshTokenExpiresAt: null,
          passwordResetToken: null,
          passwordResetExpires: null,
          blocked: false,
          blockedUntil: null,
          loginAttempts: 0,
          lastFailedLogin: null,
          cpf: null,
          telefone: null,
          avatarUrl: null,
          votosDisponiveisComum: 0,
          votosUtilizadosComum: 0,
          votosDisponiveisSuper: 0,
          votosUtilizadosSuper: 0,
        },
      ];
      mockUserRepository.findAllPaged.mockResolvedValue({
        data: users,
        total: users.length,
        page: 1,
        limit: 10,
      });

      const result = await service.findAllPaged({ page: 1, limit: 10 });
      // O serviço retorna paginação com PublicUserDto mapeado
      expect(result).toEqual(
        expect.objectContaining({
          page: 1,
          limit: 10,
          total: users.length,
          data: expect.arrayContaining([
            expect.objectContaining({
              userId: users[0].userId,
              userName: users[0].userName,
              name: users[0].name,
              email: users[0].email,
              cpf: users[0].cpf,
              avatarUrl: users[0].avatarUrl,
              role: users[0].role,
              active: users[0].active,
              blocked: users[0].blocked,
              createdAt: users[0].createdAt,
              updatedAt: users[0].updatedAt,
              lastLogin: users[0].lastLogin,
              endereco: expect.any(Object),
            }),
          ]),
        }),
      );
      expect(mockUserRepository.findAllPaged).toHaveBeenCalled();
    });
  });

  describe('findOneById', () => {
    it('should return a single user', async () => {
      const user: User = {
        userId: '1',
        userName: 'user1',
        name: 'User One',
        email: 'user1@example.com',
        password: 'p1',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        role: Role.USUARIO,
        lastLogin: null,
        tokenVersion: 1,
        refreshToken: null,
        refreshTokenExpiresAt: null,
        passwordResetToken: null,
        passwordResetExpires: null,
        blocked: false,
        blockedUntil: null,
        loginAttempts: 0,
        lastFailedLogin: null,
        cpf: null,
        telefone: null,
        avatarUrl: null,
        votosDisponiveisComum: 0,
        votosUtilizadosComum: 0,
        votosDisponiveisSuper: 0,
        votosUtilizadosSuper: 0,
      };
      mockUserRepository.findById.mockResolvedValue(user);

      const requestingUser = { userId: '1', role: Role.USUARIO };
      const result = await service.findOneById('1', requestingUser);
      expect(result).toEqual(
        expect.objectContaining({
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
          endereco: expect.any(Object),
        }),
      );
      expect(mockUserRepository.findById).toHaveBeenCalledWith('1');
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const user: User = {
        userId: '1',
        userName: 'user1',
        name: 'User One',
        email: 'user1@example.com',
        password: 'p1',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        role: Role.USUARIO,
        lastLogin: null,
        tokenVersion: 1,
        refreshToken: null,
        refreshTokenExpiresAt: null,
        passwordResetToken: null,
        passwordResetExpires: null,
        blocked: false,
        blockedUntil: null,
        loginAttempts: 0,
        lastFailedLogin: null,
        cpf: null,
        telefone: null,
        avatarUrl: null,
        votosDisponiveisComum: 0,
        votosUtilizadosComum: 0,
        votosDisponiveisSuper: 0,
        votosUtilizadosSuper: 0,
      };
      const updatedUser: User = { ...user, name: 'User One Updated' };
      mockUserRepository.update.mockResolvedValue(updatedUser);

      const requestingUser = { userId: '1', role: Role.USUARIO };
      const result = await service.update(
        '1',
        { name: 'User One Updated' },
        requestingUser,
      );
      expect(result).toEqual(
        expect.objectContaining({
          userId: updatedUser.userId,
          userName: updatedUser.userName,
          name: 'User One Updated',
          email: updatedUser.email,
          cpf: updatedUser.cpf,
          avatarUrl: updatedUser.avatarUrl,
          role: updatedUser.role,
          active: updatedUser.active,
          blocked: updatedUser.blocked,
          createdAt: updatedUser.createdAt,
          updatedAt: updatedUser.updatedAt,
          lastLogin: updatedUser.lastLogin,
          endereco: expect.any(Object),
        }),
      );
      expect(mockUserRepository.update).toHaveBeenCalledWith('1', {
        name: 'User One Updated',
      });
    });
  });

  describe('remove', () => {
    it('should soft delete user', async () => {
      const user: User = {
        userId: '1',
        userName: 'user1',
        name: 'User One',
        email: 'user1@example.com',
        password: 'p1',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        role: Role.USUARIO,
        lastLogin: null,
        tokenVersion: 1,
        refreshToken: null,
        refreshTokenExpiresAt: null,
        passwordResetToken: null,
        passwordResetExpires: null,
        blocked: false,
        blockedUntil: null,
        loginAttempts: 0,
        lastFailedLogin: null,
        cpf: null,
        telefone: null,
        avatarUrl: null,
        votosDisponiveisComum: 0,
        votosUtilizadosComum: 0,
        votosDisponiveisSuper: 0,
        votosUtilizadosSuper: 0,
      };
      const deletedUser: User = { ...user, deletedAt: new Date() };
      mockUserRepository.remove.mockResolvedValue(deletedUser);

      const result = await service.remove('1');
      expect(result).toEqual(
        expect.objectContaining({
          userId: deletedUser.userId,
          userName: deletedUser.userName,
          name: deletedUser.name,
          email: deletedUser.email,
          cpf: deletedUser.cpf,
          avatarUrl: deletedUser.avatarUrl,
          role: deletedUser.role,
          active: deletedUser.active,
          blocked: deletedUser.blocked,
          createdAt: deletedUser.createdAt,
          updatedAt: deletedUser.updatedAt,
          lastLogin: deletedUser.lastLogin,
          endereco: expect.any(Object),
        }),
      );
      expect(mockUserRepository.remove).toHaveBeenCalledWith('1');
    });
  });
});
