const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function resetPassword() {
  try {
    // Listar todos os usuários
    const users = await prisma.user.findMany({
      select: {
        userId: true,
        email: true,
        name: true,
        role: true,
      },
      take: 10,
    });
    
    if (users.length === 0) {
      console.log('❌ Nenhum usuário encontrado no banco de dados.');
      console.log('💡 Você precisa criar um usuário primeiro.');
      return;
    }
    
    console.log('\n📋 Usuários encontrados no banco:\n');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name || 'Sem nome'}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   ID: ${user.userId}\n`);
    });
    
    // Resetar senha do primeiro usuário (geralmente o admin)
    const newPassword = '12345678';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const firstUser = users[0];
    await prisma.user.update({
      where: { userId: firstUser.userId },
      data: { password: hashedPassword },
    });
    
    console.log(`✅ Senha resetada para: ${firstUser.email}`);
    console.log(`🔐 Nova senha: ${newPassword}`);
    console.log('⚠️  IMPORTANTE: Altere a senha após o primeiro login!\n');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword();
