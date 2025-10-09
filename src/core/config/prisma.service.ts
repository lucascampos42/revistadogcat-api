import { Injectable, OnModuleInit, INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  enableShutdownHooks(app: INestApplication) {
    // Usa o evento do processo para garantir encerramento gracioso da aplicação
    // sem depender da tipagem do $on do Prisma (que pode variar entre versões).
    process.on('beforeExit', async () => {
      await app.close();
    });
  }
}
