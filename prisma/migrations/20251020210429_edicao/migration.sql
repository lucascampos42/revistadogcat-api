/*
  Warnings:

  - You are about to drop the `logs` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."logs" DROP CONSTRAINT "logs_userId_fkey";

-- AlterTable
ALTER TABLE "edicoes" ALTER COLUMN "descricao" DROP NOT NULL;

-- DropTable
DROP TABLE "public"."logs";
