import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);
  const saltOrRounds = 10;

  // --- 1. Criar Usuário Administrador ---
  const adminPassword = await bcrypt.hash('12345678', saltOrRounds);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@admin.com' },
    update: {},
    create: {
      name: 'Admin User',
      userName: 'admin',
      email: 'admin@admin.com',
      password: adminPassword,
      role: Role.ADMIN,
      active: true, // Admin já nasce ativo
      cpf: '00000000000',
      // Campos de sistema com valores padrão
      tokenVersion: 1,
      loginAttempts: 0,
      blocked: false,
      lastLogin: null,
      blockedUntil: null,
      lastFailedLogin: null,
      refreshToken: null,
      activationToken: null,
      activationTokenExpires: null,
      passwordResetToken: null,
      passwordResetExpires: null,
      deletedAt: null,
    },
  });
  console.log(`Created/updated admin user: ${adminUser.email}`);

  // --- 2. Criar Usuário Comum ---
  const userPassword = await bcrypt.hash('12345678', saltOrRounds);
  const regularUser = await prisma.user.upsert({
    where: { email: 'user@user.com' },
    update: {},
    create: {
      name: 'Regular User',
      userName: 'user',
      email: 'user@user.com',
      password: userPassword,
      role: Role.USUARIO,
      active: true, // Usuário comum também já nasce ativo para facilitar testes
      cpf: '11111111111',
      // Campos de sistema com valores padrão
      tokenVersion: 1,
      loginAttempts: 0,
      blocked: false,
      lastLogin: null,
      blockedUntil: null,
      lastFailedLogin: null,
      refreshToken: null,
      activationToken: null,
      activationTokenExpires: null,
      passwordResetToken: null,
      passwordResetExpires: null,
      deletedAt: null,
    },
  });
  console.log(`Created/updated regular user: ${regularUser.email}`);

  console.log(`Seeding finished.`);
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
