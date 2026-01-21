const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function resetAdminPassword() {
  try {
    const newPassword = '12345678';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Buscar todos os usuários admin
    const admins = await prisma.user.findMany({
      where: {
        role: 'ADMIN'
      },
      select: {
        userId: true,
        email: true,
        name: true,
      }
    });
    
    if (admins.length === 0) {
      console.log('❌ Nenhum usuário admin encontrado no banco de dados.');
      return;
    }
    
    console.log('\n📋 Usuários admin encontrados:\n');
    admins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.name || 'Sem nome'} (${admin.email})`);
    });
    
    // Atualizar senha de todos os admins
    for (const admin of admins) {
      await prisma.user.update({
        where: { userId: admin.userId },
        data: { password: hashedPassword },
      });
      console.log(`✅ Senha atualizada para: ${admin.email}`);
    }
    
    console.log('\n🔐 Nova senha para todos os admins: 12345678');
    console.log('⚠️  IMPORTANTE: Altere a senha após o primeiro login!\n');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdminPassword();
