const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    // Verificar se já existe algum admin
    const existingAdmin = await prisma.user.findFirst({
      where: {
        email: 'admin@admin.com'
      }
    });
    
    if (existingAdmin) {
      // Atualizar senha do admin existente
      const hashedPassword = await bcrypt.hash('12345678', 10);
      await prisma.user.update({
        where: { userId: existingAdmin.userId },
        data: { password: hashedPassword },
      });
      console.log('✅ Senha do admin atualizada!');
      console.log(`📧 Email: admin@admin.com`);
      console.log(`🔐 Senha: 12345678\n`);
      return;
    }
    
    // Criar novo admin
    const hashedPassword = await bcrypt.hash('12345678', 10);
    
    const admin = await prisma.user.create({
      data: {
        email: 'admin@admin.com',
        password: hashedPassword,
        name: 'Administrador',
        role: 'ADMIN',
        active: true,
      },
    });
    
    console.log('✅ Usuário admin criado com sucesso!');
    console.log(`📧 Email: ${admin.email}`);
    console.log(`🔐 Senha: 12345678`);
    console.log(`👤 Nome: ${admin.name}`);
    console.log(`🎭 Role: ${admin.role}\n`);
    console.log('⚠️  IMPORTANTE: Altere a senha após o primeiro login!\n');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    if (error.code === 'P2002') {
      console.log('💡 O email admin@admin.com já existe. Use o script reset-password.js');
    }
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
