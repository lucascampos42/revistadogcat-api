/*
  Warnings:

  - The values [PENDENTE] on the enum `StatusCadastro` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "StatusCadastro_new" AS ENUM ('APROVADO', 'REJEITADO', 'CADASTRO_INCOMPLETO');
ALTER TABLE "public"."cadastros_cao" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "cadastros_cao" ALTER COLUMN "status" TYPE "StatusCadastro_new" USING ("status"::text::"StatusCadastro_new");
ALTER TYPE "StatusCadastro" RENAME TO "StatusCadastro_old";
ALTER TYPE "StatusCadastro_new" RENAME TO "StatusCadastro";
DROP TYPE "public"."StatusCadastro_old";
ALTER TABLE "cadastros_cao" ALTER COLUMN "status" SET DEFAULT 'CADASTRO_INCOMPLETO';
COMMIT;

-- AlterTable
ALTER TABLE "cadastros_cao" ALTER COLUMN "status" SET DEFAULT 'CADASTRO_INCOMPLETO';
