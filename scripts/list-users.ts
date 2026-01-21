import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        userId: true,
        email: true,
        name: true,
        role: true,
      },
    });
    
    console.log('\n📋 Usuários cadastrados no sistema:\n');
    console.log('═'.repeat(80));
    
    if (users.length === 0) {
      console.log('Nenhum usuário encontrado no banco de dados.');
    } else {
      users.forEach((user, index) => {
        console.log(`\n${index + 1}. ${user.name || 'Sem nome'}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   ID: ${user.userId}`);
      });
    }
    
    console.log('\n' + '═'.repeat(80));
    console.log(`\nTotal: ${users.length} usuário(s)\n`);
  } catch (error) {
    console.error('❌ Erro ao listar usuários:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listUsers();
