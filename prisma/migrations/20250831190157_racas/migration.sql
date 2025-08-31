/*
  Warnings:

  - You are about to drop the column `raca` on the `cadastros_cao` table. All the data in the column will be lost.
  - Added the required column `racaId` to the `cadastros_cao` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."cadastros_cao" DROP COLUMN "raca",
ADD COLUMN     "racaId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "public"."racas" (
    "racaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "racas_pkey" PRIMARY KEY ("racaId")
);

-- CreateIndex
CREATE UNIQUE INDEX "racas_nome_key" ON "public"."racas"("nome");

-- AddForeignKey
ALTER TABLE "public"."cadastros_cao" ADD CONSTRAINT "cadastros_cao_racaId_fkey" FOREIGN KEY ("racaId") REFERENCES "public"."racas"("racaId") ON DELETE RESTRICT ON UPDATE CASCADE;
