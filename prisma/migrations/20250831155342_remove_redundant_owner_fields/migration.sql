/*
  Warnings:

  - You are about to drop the column `cidade` on the `cadastros_cao` table. All the data in the column will be lost.
  - You are about to drop the column `cpfProprietario` on the `cadastros_cao` table. All the data in the column will be lost.
  - You are about to drop the column `emailProprietario` on the `cadastros_cao` table. All the data in the column will be lost.
  - You are about to drop the column `enderecoProprietario` on the `cadastros_cao` table. All the data in the column will be lost.
  - You are about to drop the column `estado` on the `cadastros_cao` table. All the data in the column will be lost.
  - You are about to drop the column `nomeProprietario` on the `cadastros_cao` table. All the data in the column will be lost.
  - You are about to drop the column `proprietarioDiferente` on the `cadastros_cao` table. All the data in the column will be lost.
  - You are about to drop the column `telefoneProprietario` on the `cadastros_cao` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "public"."CategoriaArtigo" ADD VALUE 'OUTROS';

-- AlterTable
ALTER TABLE "public"."cadastros_cao" DROP COLUMN "cidade",
DROP COLUMN "cpfProprietario",
DROP COLUMN "emailProprietario",
DROP COLUMN "enderecoProprietario",
DROP COLUMN "estado",
DROP COLUMN "nomeProprietario",
DROP COLUMN "proprietarioDiferente",
DROP COLUMN "telefoneProprietario";
