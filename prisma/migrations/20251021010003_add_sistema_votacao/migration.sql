-- CreateEnum
CREATE TYPE "AcaoKardex" AS ENUM ('VOTO_CRIADO', 'VOTO_REMOVIDO', 'VOTO_INVALIDADO', 'USUARIO_BLOQUEADO', 'CADASTRO_DESATIVADO');

-- AlterTable
ALTER TABLE "cadastros_cao" ADD COLUMN     "ativo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "totalVotos" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "votosDisponiveis" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "votosUtilizados" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "votos" (
    "votoId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cadastroId" TEXT NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "votos_pkey" PRIMARY KEY ("votoId")
);

-- CreateTable
CREATE TABLE "kardex_votos" (
    "kardexId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cadastroId" TEXT NOT NULL,
    "acao" "AcaoKardex" NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kardex_votos_pkey" PRIMARY KEY ("kardexId")
);

-- CreateIndex
CREATE UNIQUE INDEX "votos_userId_cadastroId_key" ON "votos"("userId", "cadastroId");

-- AddForeignKey
ALTER TABLE "votos" ADD CONSTRAINT "votos_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votos" ADD CONSTRAINT "votos_cadastroId_fkey" FOREIGN KEY ("cadastroId") REFERENCES "cadastros_cao"("cadastroId") ON DELETE CASCADE ON UPDATE CASCADE;
