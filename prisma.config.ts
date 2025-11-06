import { defineConfig } from 'prisma/config';
import path from 'node:path';
import * as dotenv from 'dotenv';

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export default defineConfig({
  // Configuração do schema
  schema: path.join('prisma', 'schema.prisma'),

  // Configuração das migrações e seed
  migrations: {
    seed: 'ts-node prisma/seed.ts',
  },

  // Configurações adicionais podem ser adicionadas aqui conforme necessário
  // Por exemplo: configurações de geração, logs, etc.
});
