/*
  Warnings:

  - You are about to drop the column `votosDisponiveis` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `votosUtilizados` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,cadastroId,tipo]` on the table `votos` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "VotoTipo" AS ENUM ('COMUM', 'SUPER');

-- DropIndex
DROP INDEX "votos_userId_cadastroId_key";

-- AlterTable
ALTER TABLE "kardex_votos" ADD COLUMN     "tipo" "VotoTipo";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "votosDisponiveis",
DROP COLUMN "votosUtilizados",
ADD COLUMN     "votosDisponiveisComum" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "votosDisponiveisSuper" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "votosUtilizadosComum" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "votosUtilizadosSuper" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "votos" ADD COLUMN     "tipo" "VotoTipo" NOT NULL DEFAULT 'COMUM';

-- CreateIndex
CREATE UNIQUE INDEX "votos_userId_cadastroId_tipo_key" ON "votos"("userId", "cadastroId", "tipo");
