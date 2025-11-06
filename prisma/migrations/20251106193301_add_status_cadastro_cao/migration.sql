-- CreateEnum
CREATE TYPE "StatusCadastro" AS ENUM ('PENDENTE', 'APROVADO', 'REJEITADO');

-- AlterTable
ALTER TABLE "cadastros_cao" ADD COLUMN     "aprovadoEm" TIMESTAMP(3),
ADD COLUMN     "aprovadoPor" TEXT,
ADD COLUMN     "motivoRejeicao" TEXT,
ADD COLUMN     "status" "StatusCadastro" NOT NULL DEFAULT 'PENDENTE';
