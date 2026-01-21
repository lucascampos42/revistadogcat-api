import { PrismaClient, Role, SexoCao, StatusCadastro, VideoOption } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);

  console.log(`Start seeding ...`);

  // 1. Limpa os dados de teste antigos para evitar duplicatas (Foreign Key Constraints)
  const usersToDelete = await prisma.user.findMany({
    where: { email: { in: ['admin@admin.com', 'user@user.com'] } },
  });
  
  if (usersToDelete.length > 0) {
    const userIds = usersToDelete.map(u => u.userId);
    console.log('Cleaning up dependencies for users:', userIds);

    // Deleta artigos vinculados
    await prisma.artigo.deleteMany({
      where: { autorId: { in: userIds } }
    });

    // Deleta cadastros de cães vinculados
    await prisma.cadastroCao.deleteMany({
      where: { userId: { in: userIds } }
    });
    
    // Deleta os usuários
    await prisma.user.deleteMany({
      where: { userId: { in: userIds } },
    });
  }
  console.log('Deleted old seed users and dependencies.');

  // 2. Cria o usuário Administrador
  const adminPassword = await bcrypt.hash('12345678', 10);
  const adminUser = await prisma.user.create({
    data: {
      name: 'Administrador',
      userName: 'admin',
      email: 'admin@admin.com',
      password: adminPassword,
      role: Role.ADMIN,
      active: true,
      cpf: '00000000000',
    },
  });
  console.log(`Created admin user: ${adminUser.email}`);

  // 3. Cria o usuário comum com um endereço principal
  const userPassword = await bcrypt.hash('12345678', 10);
  const regularUser = await prisma.user.create({
    data: {
      name: 'Regular User',
      userName: 'user',
      email: 'user@user.com',
      password: userPassword,
      role: Role.USUARIO,
      active: true,
      cpf: '11111111111',
      enderecos: {
        create: {
          logradouro: 'Rua das Flores',
          numero: '123',
          bairro: 'Centro',
          cidade: 'São Paulo',
          estado: 'SP',
          cep: '01000-000',
          principal: true,
        },
      },
    },
  });
  console.log(
    `Created regular user: ${regularUser.email} with a main address.`,
  );

  // 4. Cria algumas raças de exemplo
  console.log('Creating seed races...');
  const racas = [
    { nome: 'Golden Retriever' },
    { nome: 'Labrador Retriever' },
    { nome: 'Buldogue Francês' },
    { nome: 'Shih Tzu' },
    { nome: 'Sem Raça Definida (SRD)' },
  ];

  for (const raca of racas) {
    await prisma.raca.upsert({
      where: { nome: raca.nome },
      update: {},
      create: { nome: raca.nome },
    });
  }
  console.log('Seed races created.');

  // 5. Cria um cachorro de teste para o Admin
  console.log('Creating test dog for Admin...');
  const goldenRetriever = await prisma.raca.findUnique({
    where: { nome: 'Golden Retriever' },
  });

  if (goldenRetriever) {
    await prisma.cadastroCao.create({
      data: {
        nome: 'Rex Teste',
        dataNascimento: new Date('2020-01-01'),
        sexo: SexoCao.MACHO,
        fotoPerfil: 'seed-profile.jpg',
        fotoLateral: 'seed-lateral.jpg',
        userId: adminUser.userId,
        racaId: goldenRetriever.racaId,
        status: StatusCadastro.APROVADO,
        ativo: true,
        videoOption: VideoOption.NONE,
        // Opcionais
        numeroMicrochip: '123456789012345',
        temPedigree: false,
        temMicrochip: true,
      },
    });
    console.log('Created test dog: Rex Teste (APROVADO)');
  }

  console.log(`Seeding finished.`);
}

// Executa o script de seed e garante que a conexão seja fechada
void (async () => {
  try {
    await main();
  } catch (e) {
    console.error('Error during seeding:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
