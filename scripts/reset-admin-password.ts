import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function resetAdminPassword() {
  try {
    // Nova senha para o admin
    const newPassword = 'Admin@123'; // Altere aqui para a senha desejada
    
    // Gerar hash da senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Atualizar senha do admin
    const updatedUser = await prisma.user.update({
      where: {
        email: 'admin@admin.com',
      },
      data: {
        password: hashedPassword,
      },
    });
    
    console.log('✅ Senha do admin atualizada com sucesso!');
    console.log(`Email: ${updatedUser.email}`);
    console.log(`Nova senha: ${newPassword}`);
    console.log('\n⚠️  IMPORTANTE: Altere a senha após o primeiro login!');
  } catch (error) {
    console.error('❌ Erro ao atualizar senha:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdminPassword();
