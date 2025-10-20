/*
  Warnings:

  - You are about to drop the column `ano` on the `edicoes` table. All the data in the column will be lost.
  - You are about to drop the column `bimestre` on the `edicoes` table. All the data in the column will be lost.
  - Added the required column `data` to the `edicoes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `descricao` to the `edicoes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "public"."Role" ADD VALUE 'JURADO';

-- AlterTable
ALTER TABLE "public"."artigos" ALTER COLUMN "imagemCapa" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."edicoes" DROP COLUMN "ano",
DROP COLUMN "bimestre",
ADD COLUMN     "data" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "descricao" TEXT NOT NULL;
