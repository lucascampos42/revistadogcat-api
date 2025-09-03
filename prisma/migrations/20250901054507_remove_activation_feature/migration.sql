/*
  Warnings:

  - You are about to drop the column `tipo` on the `enderecos` table. All the data in the column will be lost.
  - You are about to drop the column `activationToken` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `activationTokenExpires` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."enderecos" DROP COLUMN "tipo";

-- AlterTable
ALTER TABLE "public"."users" DROP COLUMN "activationToken",
DROP COLUMN "activationTokenExpires",
ALTER COLUMN "active" SET DEFAULT true;

-- DropEnum
DROP TYPE "public"."TipoEndereco";
