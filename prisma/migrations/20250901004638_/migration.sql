/*
  Warnings:

  - You are about to drop the `racas` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."cadastros_cao" DROP CONSTRAINT "cadastros_cao_racaId_fkey";

-- DropTable
DROP TABLE "public"."racas";

-- CreateTable
CREATE TABLE "public"."raca" (
    "racaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "raca_pkey" PRIMARY KEY ("racaId")
);

-- CreateIndex
CREATE UNIQUE INDEX "raca_nome_key" ON "public"."raca"("nome");

-- AddForeignKey
ALTER TABLE "public"."cadastros_cao" ADD CONSTRAINT "cadastros_cao_racaId_fkey" FOREIGN KEY ("racaId") REFERENCES "public"."raca"("racaId") ON DELETE RESTRICT ON UPDATE CASCADE;
