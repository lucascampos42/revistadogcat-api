import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function checkAndFixUser(email: string) {
  console.log(`\n🔍 Verificando usuário: ${email}\n`);

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        userId: true,
        name: true,
        email: true,
        userName: true,
        role: true,
        active: true,
        blocked: true,
        blockedUntil: true,
        loginAttempts: true,
        lastFailedLogin: true,
        password: true,
        createdAt: true,
      },
    });

    if (!user) {
      console.log('❌ Usuário não encontrado!');
      return;
    }

    console.log('📋 Informações do Usuário:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`ID:           ${user.userId}`);
    console.log(`Nome:         ${user.name}`);
    console.log(`Email:        ${user.email}`);
    console.log(`Username:     ${user.userName}`);
    console.log(`Role:         ${user.role}`);
    console.log(`Ativo:        ${user.active ? '✅ Sim' : '❌ Não'}`);
    console.log(`Bloqueado:    ${user.blocked ? '🔒 Sim' : '✅ Não'}`);
    console.log(`Tentativas:   ${user.loginAttempts}`);

    if (user.blockedUntil) {
      console.log(
        `Bloqueado até: ${user.blockedUntil.toLocaleString('pt-BR')}`,
      );
    }

    if (user.lastFailedLogin) {
      console.log(
        `Última falha:  ${user.lastFailedLogin.toLocaleString('pt-BR')}`,
      );
    }

    console.log(`Tem senha:    ${user.password ? '✅ Sim' : '❌ Não'}`);
    console.log(`Criado em:    ${user.createdAt.toLocaleString('pt-BR')}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Verificar se está bloqueado
    if (user.blocked) {
      console.log('⚠️  USUÁRIO ESTÁ BLOQUEADO!\n');

      // Desbloquear
      console.log('🔓 Desbloqueando usuário...');
      await prisma.user.update({
        where: { userId: user.userId },
        data: {
          blocked: false,
          blockedUntil: null,
          loginAttempts: 0,
          lastFailedLogin: null,
        },
      });
      console.log('✅ Usuário desbloqueado com sucesso!\n');
    }

    // Verificar se precisa resetar tentativas
    if (user.loginAttempts > 0) {
      console.log('🔄 Resetando tentativas de login...');
      await prisma.user.update({
        where: { userId: user.userId },
        data: {
          loginAttempts: 0,
          lastFailedLogin: null,
        },
      });
      console.log('✅ Tentativas resetadas!\n');
    }

    // Testar senha
    if (user.password) {
      console.log('🔐 Testando senha...');
      const testPassword = 'Senha123'; // Senha padrão para teste
      const isMatch = await bcrypt.compare(testPassword, user.password);
      console.log(
        `Senha "${testPassword}": ${isMatch ? '✅ Correta' : '❌ Incorreta'}`,
      );

      if (!isMatch) {
        console.log('\n💡 A senha não é "Senha123". Deseja resetar? (y/n)');
        console.log(
          '   Execute: npm run reset-password admin@admin.com Senha123',
        );
      }
    }

    console.log('\n✅ Verificação concluída!\n');
  } catch (error) {
    console.error('❌ Erro ao verificar usuário:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function resetPassword(email: string, newPassword: string) {
  console.log(`\n🔑 Resetando senha para: ${email}\n`);

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log('❌ Usuário não encontrado!');
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { userId: user.userId },
      data: {
        password: hashedPassword,
        blocked: false,
        blockedUntil: null,
        loginAttempts: 0,
        lastFailedLogin: null,
      },
    });

    console.log('✅ Senha resetada com sucesso!');
    console.log(`   Nova senha: ${newPassword}\n`);
  } catch (error) {
    console.error('❌ Erro ao resetar senha:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function listAllUsers() {
  console.log('\n📋 Listando todos os usuários:\n');

  try {
    const users = await prisma.user.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        userId: true,
        name: true,
        email: true,
        role: true,
        active: true,
        blocked: true,
        loginAttempts: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    users.forEach((user) => {
      const status = !user.active
        ? '❌ Inativo'
        : user.blocked
          ? '🔒 Bloqueado'
          : '✅ Ativo';
      console.log(
        `${status} | ${user.email.padEnd(30)} | ${user.role.padEnd(15)} | Tentativas: ${user.loginAttempts}`,
      );
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`\nTotal: ${users.length} usuários\n`);
  } catch (error) {
    console.error('❌ Erro ao listar usuários:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Processar argumentos da linha de comando
const args = process.argv.slice(2);
const command = args[0];
const param1 = args[1];
const param2 = args[2];

(async () => {
  if (!command) {
    console.log('\n📚 Uso do script:\n');
    console.log('  npx ts-node scripts/check-user.ts check <email>');
    console.log(
      '  npx ts-node scripts/check-user.ts reset <email> <nova-senha>',
    );
    console.log('  npx ts-node scripts/check-user.ts list');
    console.log('\n📝 Exemplos:\n');
    console.log('  npx ts-node scripts/check-user.ts check admin@admin.com');
    console.log(
      '  npx ts-node scripts/check-user.ts reset admin@admin.com Senha123',
    );
    console.log('  npx ts-node scripts/check-user.ts list\n');
    return;
  }

  switch (command) {
    case 'check':
      if (!param1) {
        console.log('❌ Email é obrigatório!');
        console.log('   Uso: npx ts-node scripts/check-user.ts check <email>');
        return;
      }
      await checkAndFixUser(param1);
      break;

    case 'reset':
      if (!param1 || !param2) {
        console.log('❌ Email e senha são obrigatórios!');
        console.log(
          '   Uso: npx ts-node scripts/check-user.ts reset <email> <senha>',
        );
        return;
      }
      await resetPassword(param1, param2);
      break;

    case 'list':
      await listAllUsers();
      break;

    default:
      console.log(`❌ Comando desconhecido: ${command}`);
      console.log('   Comandos válidos: check, reset, list');
  }
})();
